<template>
  <div id="cust-wrap">
    <div class="ol-map" ref="olMap"></div>
    <div class="btnList">
      <span class="list-span" @click="onSelect(0)">高德图层</span>
      <span class="list-span" @click="onSelect(1)">卫星图层</span>
    </div>
    <!-- 覆盖物--点 -->
    <div id="marker"></div>
    <!-- 覆盖物--弹窗 -->
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content" class="popup-content"></div>
    </div>
    <div @click="onTian">天地图层</div>
  </div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol'; //Coordinate
import { Tile as TileLayer } from 'ol/layer'; //Vector
import { XYZ } from 'ol/source'; // OSM
import { fromLonLat, transform, toLonLat } from 'ol/proj';
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from 'ol/interaction';
import {
  defaults,
  ScaleLine,
  FullScreen,
  MousePosition,
  ZoomSlider,
  OverviewMap,
} from 'ol/control';
import { toStringHDMS } from 'ol/coordinate';
import Overlay from 'ol/Overlay';

export default {
  name: 'Home',
  data() {
    return {
      map: null,
      tileLayer: null,
      img1: null,
      // overlay: null, //弹窗放在全局的变量
    };
  },
  mounted() {
    this.initMap();
  },

  methods: {
    /**
     * 初始化一个 openlayers 地图
     */
    initMap() {
      // 使用内置的OSM
      //const tileLayer = new TileLayer({
      //    source: new OSM()
      //})
      // 使用高德
      this.tileLayer = new TileLayer({
        //栅格图层，返回到浏览器的是一张张的瓦片图片，切片图层类型
        //一类是在服务器端渲染好，以图片形式返回浏览器的， imagelayer 和 tilelayer都是属于这种类型一类是在浏览器渲染的图层类型，vectorlayer 和 heatmaplayer就是这种类型。
        className: '高德图',
        source: new XYZ({
          url:
            'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        }),
        visible: true,
      });
      this.img1 = new TileLayer({
        className: '天地图影像图层',
        visible: false,
        source: new XYZ({
          url:
            'http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=5d27dc75ca0c3bdf34f657ffe1e9881d', //parent.TiandituKey()为天地图密钥
          wrapX: false, //是否水平包裹世界
        }),
      });
      this.map = new Map({
        layers: [this.tileLayer, this.img1], // 图层
        view: new View({
          //视图
          center: fromLonLat([120.771441, 30.756433]), //地图中心点
          zoom: 5, // 缩放级别
          minZoom: 1, // 最小缩放级别
          maxZoom: 18, // 最大缩放级别
          constrainResolution: true, // 因为存在非整数的缩放级别，所以设置该参数为true来让每次缩放结束后自动缩放到距离最近的一个整数级别，这个必须要设置，当缩放在非整数级别时地图会糊
        }),
        interactions: defaultInteractions().extend([new DragRotateAndZoom()]), //地图交互(旋转)
        controls: defaults({ zoom: true }).extend([
          // //地图控件
          new FullScreen(), // 全屏
          new MousePosition(), // 显示鼠标当前位置的经纬度
          new ScaleLine(), // 显示比例尺
          new ZoomSlider(), //滑块
          new OverviewMap(), //使用地图作为另一个定义地图的概览图创建一个新控件。
        ]),
        target: this.$refs.olMap, // DOM容器
      });
      // -------------------------覆盖物点标记(非动态添加)-------------------------
      this.pointFun();
      // -------------------------覆盖物弹窗(非动态添加)---------------------------
      this.popupFun();
    },
    // 覆盖物点标记(非动态添加)
    pointFun() {
      var marker = new Overlay({
        id: 'pointOverlay',
        position: fromLonLat([104.043505, 30.58165]), //覆盖物坐标
        positioning: 'center-center',
        element: document.getElementById('marker'),
        stopEvent: false,
      });
      this.map.addOverlay(marker);
      // console.log(marker.getId()); //获取id
      // setTimeout(() => {
      //   this.map.removeOverlay(marker); //删除覆盖物
      // }, 5000);
    },
    //覆盖物弹窗(非动态添加)
    popupFun() {
      // 使用变量存储弹窗所需的 DOM 对象
      var container = document.getElementById('popup');
      var closer = document.getElementById('popup-closer');
      var content = document.getElementById('popup-content');
      // 创建一个弹窗 Overlay 对象
      var overlay = new Overlay({
        id: 'popupOverlay',
        element: container, //绑定 Overlay 对象和 DOM 对象的
        autoPan: true, // 定义弹出窗口在边缘点击时候可能不完整 设置自动平移效果
        positioning: 'bottom-left', //定义叠加层相对于其position属性的实际定位方式
        offset: [-45, 0], //水平方向与垂直方向的偏移量
        autoPanAnimation: {
          duration: 250, //自动平移效果的动画时间 9毫秒）
        },
      });
      // 将弹窗添加到 map 地图中
      this.map.addOverlay(overlay);
      // let _that = this;
      //为弹窗添加一个响应关闭的函数
      closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };
      //添加单击响应函数来处理弹窗动作
      this.map.on('singleclick', function(evt) {
        console.log(evt.coordinate); //EPSG:3857 伪墨卡托投影
        //singleclick 真正的单击，无需拖动和双击。请注意，此事件会延迟 250 毫秒，以确保它不是双击。
        let coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        // 点击尺 （这里是尺(米)，并不是经纬度）;
        let hdms = toStringHDMS(toLonLat(evt.coordinate)); // 转换为经纬度显示(格式：31° 16′ 35″ N 108° 18′ 47″ E)
        content.innerHTML = `
                <p>你点击了这里：</p>
                <p>经纬度：<p>${hdms}<p>
                <p>坐标：</p>经度：${coordinate[0]} &nbsp;&nbsp; 纬度: ${coordinate[1]}`;
        overlay.setPosition(evt.coordinate); //把 overlay 显示到指定的 x,y坐标
      });
    },
    //图层切换(图层的更换-删除图层)
    onSelect() {
      // //高德地图
      // const img0 = new TileLayer({
      //   className: "高德图层",
      //   source: new XYZ({
      //     url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      //   }),
      // });
      // //天地图影像图层
      // const img1 = new TileLayer({
      //   className: "天地图影像图层",
      //   source: new XYZ({
      //     url: "http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=5d27dc75ca0c3bdf34f657ffe1e9881d", //parent.TiandituKey()为天地图密钥
      //     wrapX: false,
      //   }),
      // });
      // //天地图影像注记图层;
      const img2 = new TileLayer({
        className: '天地图影像注记图层',
        source: new XYZ({
          url:
            'http://t0.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=5d27dc75ca0c3bdf34f657ffe1e9881d', //parent.TiandituKey()为天地图密钥
          wrapX: false,
        }),
      });
      this.map.addLayer(img2);
      // if (index == 0) {
      //   this.map.addLayer(img0);
      //   this.map.removeLayer(img1);
      //   this.map.removeLayer(img2);
      // } else {
      //   this.map.addLayer(img1);
      //   this.map.addLayer(img2);
      //   this.map.removeLayer(img0);
      // }
    },
    //天地图层(图层的切换-控制显隐性)
    onTian() {
      this.tileLayer.setVisible(false);
      this.img1.setVisible(true);
      console.log(this.map.getTargetElement());
      const getLayersArray = this.map.getLayers().array_; //地图获取图层实设置
      console.log(getLayersArray);
      // getLayersArray[0].setVisible(false);
      // getLayersArray[1].setVisible(true);
    },
  },
};
/*

1.this.map.getLayers().array_  地图实例获取 所有 图层
2.this.map.getOverlays()  地图实例获取 所有 覆盖物(Overlays)
3.this.map.getOverlayById('pointOverlay') 地图实例获取 指定的 覆盖物'pointOverlay' (Overlays)
4.this.map.getTargetElement()  地图实例获取 地图的 覆盖物'pointOverlay' (Overlays)

// -------------------------------------图层(Layer)-----------------------------------------------
5.this.map.addLayer(img0) 添加图层,添加在最顶层的
6.this.map.removeLayer(img0);  删除图层

// ------------------------------------覆盖物(Overlay)-----------------------------------
7.this.map.addOverlay(overlay); //添加覆盖物
8.this.map.removeOverlay(overlay); //删除覆盖物
*/
</script>
<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
}
.ol-map {
  width: 100%;
  height: 90vh;
}
#marker {
  width: 20px;
  height: 20px;
  background: red;
  border-radius: 50%;
}
.ol-popup {
  position: relative;
  background-color: white;
  -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  // left: -50px;
}
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: ' ';
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.popup-content {
  width: 400px;
}
.ol-popup-closer:after {
  content: '✖';
}
.btnList {
  position: fixed;
  top: 10px;
  right: 10px;
  .list-span {
    margin: 0 5px;
    cursor: pointer;
    background: rgb(121, 121, 211);
  }
}
</style>
