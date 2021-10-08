<template>
  <div>
    <div id="mapTask" class="mapTask"></div>
    <label for="speed">
      速度:<input
        id="speed"
        type="range"
        min="10"
        max="999"
        step="10"
        value="60"
      />
    </label>
    <button id="start-animation">开始动画</button>
  </div>
</template>

<script>
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { getVectorContext } from 'ol/render';
import { LineString } from 'ol/geom'; //防止与style中的Circle重名
export default {
  data() {
    return {
      map: null,
    };
  },
  mounted() {
    this.map = new Map({
      target: document.getElementById('mapTask'),
      view: new View({
        center: [11570599.029921185, 3577182.750410441],
        zoom: 10,
        minZoom: 2,
        maxZoom: 19,
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url:
              'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
          }),
        }),
      ],
    });
    this.init();
  },
  methods: {
    init() {
      const route = new LineString([
        [11569360.043442508, 3595251.3472059933],
        [11569669.786123537, 3591740.876982682],
        [11570082.78424219, 3589779.1398577183],
        [11569876.289121505, 3586888.1687817085],
        [11570702.277481528, 3585442.679305062],
        [11566159.321808187, 3585029.683155729],
        [11565849.571249876, 3583171.1994990706],
        [11567191.81316618, 3578215.2417684337],
        [11570599.029921185, 3577182.750410441],
        [11571734.768839521, 3575634.013373452],
        [11571115.275600182, 3573465.779158482],
        [11573283.50587651, 3571504.0479414808],
        [11580923.943501113, 3570058.558464834],
        [11582885.678656757, 3571917.042121493],
        [11586086.400291078, 3571504.0479414808],
        [11587738.384888409, 3568819.568047514],
        [11595378.822513012, 3569542.312785838],
        [11595791.820631666, 3573775.525778151],
      ]);
      const routeFeature = new Feature({
        type: 'route',
        geometry: route,
      }); //线(路径)

      //开始图标
      const startMarker = new Feature({
        type: 'icon',
        geometry: new Point(route.getFirstCoordinate()),
      });

      //结束图标
      const endMarker = new Feature({
        type: 'icon',
        geometry: new Point(route.getLastCoordinate()),
      });

      //跑动的圆点
      const position = startMarker.getGeometry().clone(); //克隆运动的轨迹图标
      const geoMarker = new Feature({
        type: 'geoMarker',
        geometry: position,
      });

      const styles = {
        route: new Style({
          stroke: new Stroke({
            width: 6, //路线的宽度
            color: [237, 212, 0, 0.8],
          }),
        }),
        icon: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: require('../assets/icon.png'),
          }),
        }),
        geoMarker: new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({
              color: 'white',
              width: 2,
            }),
          }),
        }),
      };

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [routeFeature, geoMarker, startMarker, endMarker],
        }),
        style: (feature) => {
          return styles[feature.get('type')];
        },
      });
      this.map.addLayer(vectorLayer);

      const speedInput = document.getElementById('speed');
      const startButton = document.getElementById('start-animation');
      let animating = false;
      let distance = 0; //距离
      let lastTime; //点击播放时候的时间戳

      //播放动画
      const moveFeature = (event) => {
        const speed = Number(speedInput.value); //获取速度
        const time = event.frameState.time;
        const elapsedTime = time - lastTime;
        distance = (distance + (speed * elapsedTime) / 1e6) % 2;
        lastTime = time;
        let currentCoordinate = route.getCoordinateAt(
          // distance > 1 ? 2 - distance : distance
          distance
        );
        if (distance > 1) {
          currentCoordinate = [
            route.getFlatCoordinates()[0],
            route.getFlatCoordinates()[1],
          ];
        }
        position.setCoordinates(currentCoordinate); //设置轨迹移动(实时)坐标
        const vectorContext = getVectorContext(event); // 获取用于绘制到事件画布的矢量上下文
        vectorContext.setStyle(styles.geoMarker);
        vectorContext.drawGeometry(position); //将几何图形渲染到画布中。renderer.setStyle()首先调用 设置渲染样式
        if (distance > 1) {
          distance = 0;
          lastTime = null;
          stopAnimation();
        }
        // 告诉OpenLayers继续postrender动画
        // console.log(distance * 100 + '%');
        this.map.render();
      };

      //开始播放
      const startAnimation = () => {
        animating = true;
        lastTime = Date.now();
        startButton.textContent = 'Stop Animation';
        console.log(vectorLayer);
        vectorLayer.on('postrender', moveFeature);
        // 通过改变事件隐藏geoMarker和触发地图渲染
        geoMarker.setGeometry(null);
      };

      //暂停播放
      const stopAnimation = () => {
        animating = false;
        startButton.textContent = 'Start Animation';
        // 保持标记在当前动画位置
        geoMarker.setGeometry(position);
        vectorLayer.un('postrender', moveFeature); // un：不收听某种类型的事件
      };
      startButton.addEventListener('click', () => {
        if (animating) {
          stopAnimation();
        } else {
          startAnimation();
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.mapTask {
  width: 100%;
  height: 90vh;
}
</style>
