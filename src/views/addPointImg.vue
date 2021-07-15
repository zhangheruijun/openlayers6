<template>
  <div id="MapPoint" ref="map"></div>
</template>
<script>
import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Map, View, Feature } from 'ol';
import {
  Style,
  Icon,
  Text,
  Fill,
  Stroke,
  Circle, //圆形
  RegularShape, //多边形状
} from 'ol/style';
import { Point } from 'ol/geom';
import { defaults as defaultControls } from 'ol/control';
import { fromLonLat } from 'ol/proj';
// import Fill from "ol/style/Fill";
// import Stroke from "ol/style/Stroke";

// 边界json数据
export default {
  data() {
    return {
      map: null,
      pointLayer: null,
      featuresArr: [],
    };
  },
  mounted() {
    this.initMap(); //初始化地图方法
    this.custFun(); //点击地图feature事件
    this.removeFeatureCustFun(); //移除feature
    let coordinates = [
      { x: '86.36158200334317', y: '41.42448570787448', type: 'che1' },
      { x: '89.71757707811526', y: '31.02619817424643', type: 'che2' },
      { x: '116.31694544853109', y: '39.868508850821115', type: 'che3' },
    ];
    this.addPoints(coordinates); //根据坐标点批量打点
  },
  methods: {
    //初始化地图
    initMap() {
      this.map = new Map({
        target: 'MapPoint',
        controls: defaultControls({
          zoom: true,
        }).extend([]),
        layers: [
          new TileLayer({
            source: new XYZ({
              url:
                'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
            }),
          }),
        ],
        view: new View({
          center: fromLonLat([108.522097, 37.272848]),
          zoom: 4.7,
          maxZoom: 19,
          minZoom: 4,
        }),
      });
    },
    //批量根据经纬度坐标打点
    addPoints(coordinates) {
      // 设置图层
      this.pointLayer = new VectorLayer({
        source: new VectorSource(),
      });
      // 添加图层
      // this.pointLayer.setStyle(
      //   new Style({
      //     fill: new Fill({ color: '#ddd' }),
      //   })
      // );
      this.map.addLayer(this.pointLayer);
      // 循环添加feature
      for (let i = 0; i < coordinates.length; i++) {
        // 创建feature，一个feature就是一个点坐标信息
        let feature = new Feature({
          custKey: 45,
          geometry: new Point(fromLonLat([coordinates[i].x, coordinates[i].y])),
        });
        feature.setId('zhang' + i); //id只能外部设置
        feature.setStyle(this.getIcon(coordinates[i].type));
        feature.setProperties({ sex: '男' }); //设置自定义属性，
        this.featuresArr.push(feature);
      } // for 结束
      // 批量添加feature
      this.pointLayer.getSource().addFeatures(this.featuresArr);
    },
    getIcon() {
      // let src = require(`../assets/${type}.png`);
      var styleIcon = new Style({
        // 设置图片效果
        // image: new Icon({
        //   src: src,
        //   // anchor: [1, 1], // 锚。默认值为图标中心
        //   scale: 0.9,
        // }),
        image: new RegularShape({
          //填充样式
          fill: new Fill({
            color: 'blue',
          }),
          stroke: new Stroke({
            //描边
            color: '#CD0000',
            width: 5,
          }),
          // radius: 30, // 	圆半径。
          points: 5, //星形和正多边形的点数。在多边形的情况下，点数是边数。
          radius1: 20, //星形的第一半径。如果设置了半径，则忽略。
          radius2: 10, //星形的第二半径。
        }),
        text: new Text({
          // 字体与大小
          font: '13px Microsoft YaHei',
          //文字填充色
          fill: new Fill({
            color: '#666',
          }),
          //文字边界宽度与颜色
          stroke: new Stroke({
            color: '#fff',
            width: 5,
          }),
          text: '25',
          // offsetY: -15,
          // textAlign: 'center', //文字对齐
        }),
      });
      return styleIcon;
    },
    //点击地图feature事件
    custFun() {
      //当鼠标移动到feature时，加上手势效果(css)
      this.map.on('pointermove', (evt) => {
        const hasCust = this.map.hasFeatureAtPixel(evt.pixel, {
          hitTolerance: 0, //hitTolerance为误差范围
        });
        if (hasCust) {
          this.map.getTargetElement().style.cursor = 'pointer';
        } else {
          this.map.getTargetElement().style.cursor = '';
        }
      });
      //当鼠点地图判断是否为feature时
      this.map.on('singleclick', (evt) => {
        if (this.map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 0 })) {
          this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
            console.log(feature.getProperties());
          });
        }
      });
    },
    //删除feature
    removeFeatureCustFun() {
      setTimeout(() => {
        const dataFeatures = this.pointLayer.getSource().getFeatures(); //获取该图层所有的Feature
        dataFeatures.forEach((item) => {
          //item.getProperties() 获取自动以属性
          if (item.getId() == 'zhang0') {
            // 删除指定的featrue
            this.pointLayer.getSource().removeFeature(item);
          }
        });
      }, 3000);
      // console.log((this.map.getLayers().array_)[1].getSource());
    },
  },
  /**
   *
   * 1. this.pointLayer.getSource()  //指定的图层去找Source
   * 2. (this.map.getLayers().array_)[1].getSource() 找到全局地图，然后找图层
   *
   * ------------------------------添加、删除 Feature-------------------------------
   * 1.this.pointLayer.getSource().addFeatures([]);  批量添加(数组)
   * 2.this.pointLayer.getSource().removeFeature(item); 删除(单个删除)
   * 3.this.pointLayer.getSource().clear(); 删除整个图层的Feature
   *
   * ------------------------------属性添加-----------------------------------------
   * 1. feature.setProperties({ sex: '男' }); //设置自定义属性，
   * 2. feature.getProperties({ sex: '男' }); //获取自定义属性，
   */
};
</script>
<style scoped lang="scss">
#MapPoint {
  width: 100%;
  height: 100vh;
}
</style>
