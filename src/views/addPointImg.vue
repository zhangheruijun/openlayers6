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
  methods: {
    /**
     * 初始化地图
     */
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

    /**
     * 批量根据经纬度坐标打点
     */
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
          geometry: new Point(fromLonLat([coordinates[i].x, coordinates[i].y])),
        });
        feature.setId('zhang' + i); //id只能外部设置
        feature.setStyle(this.getIcon(coordinates[i].type));
        this.featuresArr.push(feature);
      } // for 结束
      // 批量添加feature
      this.pointLayer.getSource().addFeatures(this.featuresArr);
      setTimeout(() => {
        const dataFeatures = this.pointLayer.getSource().getFeatures(); //获取该图层所有的Feature
        dataFeatures.forEach((item) => {
          if (item.getId() == 'zhang0') {
            // 删除指定的featrue
            this.pointLayer.getSource().removeFeature(item);
          }
        });
      }, 3000);
      this.map.on('click', function(type, listener) {
        console.log(type);
      });
      // console.log((this.map.getLayers().array_)[1].getSource());
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
  },
  mounted() {
    this.initMap(); //初始化地图方法
    let coordinates = [
      { x: '86.36158200334317', y: '41.42448570787448', type: 'che1' },
      { x: '89.71757707811526', y: '31.02619817424643', type: 'che2' },
      { x: '116.31694544853109', y: '39.868508850821115', type: 'che3' },
    ];
    this.addPoints(coordinates); //根据坐标点批量打点
  },
  /**
   * 1. this.pointLayer.getSource()  //指定的图层去找Source
   * 2. (this.map.getLayers().array_)[1].getSource()  //找到全局地图，然后找图层
   */
};
</script>
<style scoped lang="scss">
#MapPoint {
  width: 100%;
  height: 100vh;
}
</style>
