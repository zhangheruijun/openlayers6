<template>
  <div class="box">
    <ul class="operation">
      <li
        class="operation-li"
        v-for="item in list"
        :key="item.value"
        @click="typeSelectChange(item.value)"
      >
        {{ item.name }}
      </li>
    </ul>
    <div class="info" ref="infoEl"></div>
    <div id="mapDraw">
      <div id="cust-zoom"></div>
    </div>
  </div>
</template>

<script>
import { Map, View } from 'ol';
import Tile from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
// import TileGrid from 'ol/tilegrid/TileGrid';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
// import Point from 'ol/geom/Point';
import { Icon, Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { Draw, Modify, Snap } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { fromLonLat } from 'ol/proj';
import { Polygon, Point, LineString, Circle as CustCircle } from 'ol/geom'; //防止与style中的Circle重名
import { DoubleClickZoom } from 'ol/interaction';
import { defaults as defaultControls } from 'ol/control';
export default {
  data() {
    return {
      list: [
        { name: '点', value: 'Point' },
        { name: '线', value: 'LineString' },
        { name: '矩形', value: 'Box' },
        { name: '多边形', value: 'Polygon' },
        { name: '圆', value: 'Circle' },
        { name: '自定义六角星', value: 'custCircle' },
        { name: '清除', value: 'clear' },
      ],
    };
  },
  mounted() {
    let center = fromLonLat([104.06, 30.6279315948486]);
    // arcgiS图层
    let arcgisLayer = new Tile({
      source: new XYZ({
        url:
          'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
      }),
    });
    // 矢量图层
    const source = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source,
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: [242, 114, 60, 1],
          lineDash: [1, 2, 3, 4, 5, 6],
        }),
        fill: new Fill({
          color: [242, 114, 60, 0.2],
        }),
        image: new CircleStyle({
          // 点的颜色
          fill: new Fill({
            color: [242, 114, 60, 0.5],
          }),
          stroke: new Stroke({
            color: [242, 114, 60, 1],
          }),
          // 圆形半径
          radius: 5,
        }),
      }),
      wrapX: false,
    });
    this.map = new Map({
      target: 'mapDraw',
      layers: [arcgisLayer, this.vectorLayer],
      view: new View({
        center: center,
        zoom: 8,
        // projection: 'EPSG:3857',
      }),
      controls: defaultControls({
        zoom: true,
      }).extend([]),
    });
    // -------------------------------------根据坐标回显图形------------------------------------------
    const pointFeature = new Feature(
      new Point(fromLonLat([106.45, 30.6279315948486]))
    ); //点
    const lineFeature = new Feature(
      new LineString([
        fromLonLat([105.06, 30.6279315948486]),
        fromLonLat([106.28, 32.9]),
      ])
    );

    const testData = [
      fromLonLat([104.06, 30.6279315948486]),
      fromLonLat([104.28, 32.9]),
      fromLonLat([104.9, 31.6299896240234]),
    ];
    const featurePolygon = new Feature(
      { geometry: new Polygon([testData]) } //plygon代表多边形，其他的还有point点，api上有写
    );
    const metersPerUnit = this.map
      .getView()
      .getProjection()
      .getMetersPerUnit();
    const circleRadius = 100000 / metersPerUnit; //半径ol.geom.Circle设置半径的单位是随投影的单位
    const circlesds = new CustCircle(
      fromLonLat([104.06, 30.6279315948486]),
      circleRadius
    );
    const featureCircle = new Feature({ geometry: circlesds });
    this.vectorLayer
      .getSource()
      .addFeatures([pointFeature, lineFeature, featurePolygon, featureCircle]);
  },
  methods: {
    typeSelectChange(value) {
      const that = this;
      this.map.removeInteraction(this.draw); //从地图中删除给定的交互
      if (value === 'clear') {
        this.vectorLayer.getSource().clear(); //删除整个图层的Feature
        this.$refs.infoEl.innerHTML = '';
      } else {
        if (value === 'Box') {
          this.draw = new Draw({
            source: this.vectorLayer.getSource(),
            geometryFunction: createBox(),
            type: 'Circle', //此实例绘制的几何图形的几何类型。// type为'Circle'或者'LineString',
            stopClick: true, //绘制时禁用点击事件
            style: this.getDrawingStyle(), //绘制过程中的样式
          });
        } else if (value === 'custCircle') {
          this.draw = new Draw({
            source: this.vectorLayer.getSource(),
            geometryFunction: this.geometryFunction,
            type: 'Circle',
            stopClick: true,
            style: this.getDrawingStyle(),
          });
        } else {
          this.draw = new Draw({
            source: this.vectorLayer.getSource(),
            type: value,
            stopClick: true, //绘制时禁用点击事件
            style: this.getDrawingStyle(),
          });
        }
        //  const dblClickInteraction = this.map
        //       .getInteractions()
        //       .getArray()
        //       .find((interaction) => {
        //         return interaction instanceof DoubleClickZoom;
        //       });
        this.draw.on('drawend', (e) => {
          // console.log((window.e = e), (window.d = this.draw));
          if (this.draw.type_ === 'Circle') {
            console.log(this.draw.type_);
            if (value == 'custCircle' || value == 'Box') {
              let coordinates = e.feature.getGeometry().getCoordinates();
              this.$refs.infoEl.innerHTML = '坐标：' + coordinates;
              console.log(coordinates);
            } else {
              let circleCenter = e.feature.getGeometry().getCenter(); //圆形
              let circleRadius = e.feature.getGeometry().getRadius();
              circleRadius = fromLonLat(
                [circleRadius, circleRadius],
                'EPSG:3857'
              )[0];
              this.$refs.infoEl.innerHTML =
                '圆心：' + circleCenter + '<br/>半径：' + circleRadius;
            }
          } else {
            let coordinates = e.feature.getGeometry().getCoordinates();
            this.$refs.infoEl.innerHTML = '坐标：' + coordinates;
            // this.map.removeInteraction(dblClickInteraction);
          }
          this.map.removeInteraction(this.draw);
        });
        console.log(this.draw);
        this.map.addInteraction(this.draw);
      }
    },
    getDrawingStyle() {
      return new Style({
        stroke: new Stroke({
          width: 2,
          color: [239, 176, 19, 1],
          lineDash: [1, 2, 3, 4, 5, 6],
        }),
        fill: new Fill({
          color: [239, 176, 19, 0.2],
        }),
        image: new CircleStyle({
          // 点的颜色
          fill: new Fill({
            color: [239, 176, 19, 0.5],
          }),
          stroke: new Stroke({
            color: [239, 176, 19, 1],
          }),
          // 圆形半径
          radius: 5,
        }),
      });
    },
    geometryFunction(coordinates, geometry) {
      // console.log(coordinates, geometry);
      // coordinates鼠标点击的起始点、终点
      const center = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      const dx = center[0] - last[0];
      const dy = center[1] - last[1];
      const radius = Math.sqrt(dx * dx + dy * dy); //返回数的平方根。如Math.sqrt(25) = 5; 这里是半径
      const rotation = Math.atan2(dy, dx); //返回从 x  轴到点 (dx ,dy ) 的角度（介于 -PI/2 与 PI/2 弧度之间）。
      const newCoordinates = [];
      const numPoints = 12;
      for (let i = 0; i < numPoints; ++i) {
        const angle = rotation + (i * 2 * Math.PI) / numPoints;
        const fraction = i % 2 === 0 ? 1 : 0.5;
        const offsetX = radius * fraction * Math.cos(angle);
        const offsetY = radius * fraction * Math.sin(angle);
        newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
      }
      newCoordinates.push(newCoordinates[0].slice());
      if (!geometry) {
        console.log(newCoordinates);
        geometry = new Polygon([newCoordinates]);
      } else {
        geometry.setCoordinates([newCoordinates]);
      }
      return geometry;
    },
  },
};
</script>
<style scoped lang="scss">
.box {
  width: 100%;
  height: 100%;
  position: relative;
  .operation {
    position: absolute;
    z-index: 1;
    top: 10px;
    left: 10px;
    display: flex;
    background: #fff;
    color: #000;
    border-radius: 2px;
    box-shadow: 1px 2px 1px rgba(0, 0, 0, 0.15);
    padding: 5px 15px 5px 10px;
    .operation-li {
      padding: 10px;
      cursor: pointer;
      border-right: 1px solid #333;
    }
  }
  .info {
    position: absolute;
    z-index: 1;
    top: 10px;
    right: 10px;
    background: #fff;
    color: #000;
    max-width: 200px;
    word-break: break-all;
  }
  #mapDraw {
    width: 100%;
    height: 100vh;
  }
  // .ol-control {
  //   display: none !important;
  // }
  ul,
  li {
    list-style: none;
  }
}
</style>
