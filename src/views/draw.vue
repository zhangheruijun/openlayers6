<template>
  <div class="box">
    <!-- <div  >
      <Dropdown
        style="margin-left: 15px"
        trigger="click"
        @on-click="typeSelectChange"
      >
        <span>
          绘制
          <Icon type="ios-arrow-down"></Icon>
        </span>
        <DropdownMenu slot="list">
          <DropdownItem name="Point">点</DropdownItem>
          <DropdownItem name="LineString">线</DropdownItem>
          <DropdownItem name="Box">矩形</DropdownItem>
          <DropdownItem name="Polygon">多边形</DropdownItem>
          <DropdownItem name="Circle">圆</DropdownItem>
          <DropdownItem name="clear">清除</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div> -->
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
    <div id="map"></div>
  </div>
</template>

<script>
import { Map, View } from 'ol';
import Tile from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style, Stroke, Fill, Circle } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import { createBox } from 'ol/interaction/Draw';
import { fromLonLat } from 'ol/proj';
export default {
  data() {
    return {
      list: [
        { name: '点', value: 'Point' },
        { name: '线', value: 'LineString' },
        { name: '矩形', value: 'Box' },
        { name: '多边形', value: 'Polygon' },
        { name: '圆', value: 'Circle' },
        { name: '清除', value: 'clear' },
      ],
    };
  },
  mounted() {
    let center = [108.946994, 34.261361];
    // arcgiS图层
    let arcgisLayer = new Tile({
      source: new XYZ({
        url:
          'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
      }),
    });
    // 矢量图层
    this.vectorLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: [242, 114, 60, 1],
          lineDash: [1, 2, 3, 4, 5, 6],
        }),
        fill: new Fill({
          color: [242, 114, 60, 0.2],
        }),
        image: new Circle({
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
    });
    this.map = new Map({
      target: 'map',
      layers: [arcgisLayer, this.vectorLayer],
      view: new View({
        center: center,
        zoom: 12,
        projection: 'EPSG:4326',
      }),
    });
  },
  methods: {
    typeSelectChange(value) {
      this.map.removeInteraction(this.draw); //从地图中删除给定的交互
      if (value === 'clear') {
        this.vectorLayer.getSource().clear(); //删除整个图层的Feature
        this.$refs.infoEl.innerHTML = '';
      } else {
        if (value === 'Box') {
          this.draw = new Draw({
            source: this.vectorLayer.getSource(),
            geometryFunction: createBox(),
            type: 'LineString',
            // stopClick: true, //绘制时禁用点击事件
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

        this.draw.on('drawend', (e) => {
          console.log((window.e = e), (window.d = this.draw));
          if (this.draw.type_ === 'Circle') {
            let circleCenter = e.feature.getGeometry().getCenter();
            let circleRadius = e.feature.getGeometry().getRadius();
            circleRadius = fromLonLat(
              [circleRadius, circleRadius],
              'EPSG:3857'
            )[0];
            this.$refs.infoEl.innerHTML =
              '圆心：' + circleCenter + '<br/>半径：' + circleRadius;
          } else {
            let coordinates = e.feature.getGeometry().getCoordinates();
            this.$refs.infoEl.innerHTML = '坐标：' + coordinates;
          }
          this.map.removeInteraction(this.draw);
        });
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
        image: new Circle({
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
  #map {
    width: 100%;
    height: 100vh;
  }
  .ol-control {
    display: none !important;
  }
  ul,
  li {
    list-style: none;
  }
}
</style>
