<template>
  <div id="pointAggregation" ref="map"></div>
</template>

<script>
import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Map, View, Feature, ol } from 'ol';
import {
  Style,
  Stroke,
  Fill,
  Icon,
  Text,
  Circle as CircleStyle,
} from 'ol/style';
import { Polygon, Point, MultiPolygon } from 'ol/geom';
import { defaults as defaultControls } from 'ol/control';
import { Cluster } from 'ol/source';
import { fromLonLat } from 'ol/proj';
export default {
  data() {
    return {
      map: null,
      areaLayer: null,
    };
  },
  methods: {
    /**
     * 初始化地图
     */
    initMap() {
      this.map = new Map({
        target: 'pointAggregation',
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
          center: fromLonLat([104.065735, 30.659462]),
          zoom: 6.5,
          maxZoom: 19,
          minZoom: 3,
        }),
      });
    },
    /**
     * 设置区域
     */
    // addArea(geo = []) {
    //   if (geo.length == 0) return false;
    //   let areaFeature = null;
    //   // 设置图层
    //   this.areaLayer = new VectorLayer({
    //     source: new VectorSource({
    //       features: [],
    //     }),
    //   });
    //   // 添加图层
    //   this.map.addLayer(this.areaLayer);
    //   geo.forEach((g) => {
    //     let lineData = g.features[0];
    //     if (lineData.geometry.type == 'MultiPolygon') {
    //       areaFeature = new Feature({
    //         geometry: new MultiPolygon(lineData.geometry.coordinates).transform(
    //           'EPSG:4326',
    //           'EPSG:3857'
    //         ),
    //       });
    //     } else if (lineData.geometry.type == 'Polygon') {
    //       areaFeature = new Feature({
    //         geometry: new Polygon(lineData.geometry.coordinates).transform(
    //           'EPSG:4326',
    //           'EPSG:3857'
    //         ),
    //       });
    //     }
    //   });
    //   areaFeature.setStyle(
    //     new Style({
    //       fill: new Fill({ color: '#4e98f444' }),
    //       stroke: new Stroke({
    //         width: 3,
    //         color: [71, 137, 227, 1],
    //       }),
    //     })
    //   );
    //   this.areaLayer.getSource().addFeatures([areaFeature]);
    // },
    addCluster(clusterData, points, clearup) {
      let sourceIntimal = new VectorSource(); //双图层(内部图层,添加的点图层)
      let clusterSource = new Cluster({
        distance: 20, //要素将聚集在一起的距离（以像素为单位）
        source: sourceIntimal,
      });
      let layer = new VectorLayer({
        source: clusterSource, // 聚合图层
        style: this.clusterStyle.call(this),
      });
      this.map.addLayer(layer);
      for (const key in clusterData) {
        points.forEach((e) => {
          if (e.name == key) {
            let point = fromLonLat([
              clusterData[key].center.lng,
              clusterData[key].center.lat,
            ]);
            var f = new Feature({
              geometry: new Point(point),
            });
            f.set('name', e.name);
            f.set('value', e.value);
            sourceIntimal.addFeature(f);
          }
        });
      }
    },
    clusterStyle() {
      return (feature, solution) => {
        // 此处feature是聚合图层上的点
        var total = 0;
        feature.get('features').forEach((value, index) => {
          console.log(value.get('value'), index);
          total += value.get('value');
        });
        // console.log(feature.get('features').length); //合并的综合点数
        var style = new Style({
          image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({
              color: 'blue',
            }),
            fill: new Fill({
              color: 'rgba(24,144,255,100)',
            }),
          }),
          text: new Text({
            text: total.toString(),
            fill: new Fill({
              color: '#FFF',
            }),
            font: '12px Calibri,sans-serif',
            stroke: new Stroke({
              color: 'red',
              width: 5,
            }),
          }),
        });
        return style;
      };
    },
  },
  mounted() {
    this.initMap();
    let clusterData = {
      成都市: { center: { lng: 104.061902, lat: 30.609503 } },
      广安市: { center: { lng: 106.619126, lat: 30.474142 } },
      绵阳市: { center: { lng: 104.673612, lat: 31.492565 } },
      雅安市: { center: { lng: 103.031653, lat: 30.018895 } },
      自贡市: { center: { lng: 104.797794, lat: 29.368322 } },
      宜宾市: { center: { lng: 104.610964, lat: 28.781347 } },
      内江市: { center: { lng: 105.064555, lat: 29.581632 } },
    };
    let points = [
      { name: '成都市', value: 85 },
      { name: '绵阳市', value: 36 },
      { name: '广安市', value: 50 },
      { name: '雅安市', value: 555 },
      { name: '自贡市', value: 55 },
      { name: '宜宾市', value: 666 },
      { name: '内江市', value: 777 },
    ];
    this.addCluster(clusterData, points, true);
  },
};
</script>
<style lang="scss" scoped>
#pointAggregation {
  width: 100%;
  height: 100vh;
}
</style>
