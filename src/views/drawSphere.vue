<template>
  <div>
    <div id="map" class="map"></div>
    <div>
      <div @click="onTypeChange('length')">测距 (LineString)</div>
      <div @click="onTypeChange('area')">测面积 (Polygon)</div>
      <div @click="onClear">清空</div>
    </div>
    <!-- <form class="form-inline">
      <label for="type">测量类型</label>
      <select id="type">
        <option value="length">测距 (LineString)</option>
        <option value="area">测面积 (Polygon)</option>
      </select>
    </form> -->
  </div>
</template>

<script>
import 'ol/ol.css';
import Draw from 'ol/interaction/Draw';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { LineString, Polygon } from 'ol/geom';
import { OSM, XYZ, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { fromLonLat, transform, toLonLat } from 'ol/proj';
export default {
  data() {
    return {
      sketch: false,
      helpTooltipElement: null, //指示框的html(怎样操作的提示语)
      helpTooltip: undefined, //指示框的overlay
      measureTooltipElement: undefined, //距离、面积框的html
      measureTooltip: undefined, // 距离、面积框的overlay
      continuePolygonMsg: '单击可继续绘制多边形',
      continueLineMsg: '单击可继续绘制该线',
      draw: undefined,
      typeSelect: 'length', //测距方式
      map: undefined, //地图
      source: undefined,
    };
  },
  mounted() {
    const raster = new TileLayer({
      source: new OSM(),
    });
    this.source = new VectorSource();
    const vector = new VectorLayer({
      source: this.source,
      // 绘制后的样式
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new XYZ({
            url:
              'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          }),
        }),
        vector,
      ],
      target: 'map',
      view: new View({
        center: fromLonLat([120.771441, 30.756433]), //地图中心点
        zoom: 15,
      }),
    });
    this.map.getViewport().addEventListener('mouseout', function() {
      //鼠标从目标上移开
      if (this.helpTooltipElement) {
        this.helpTooltipElement?.classList?.add('hidden');
      }
    });
    // this.addInteraction();
  },
  methods: {
    //测距的方式
    onTypeChange(type) {
      this.map.on('pointermove', this.pointerMoveHandler); //指针移动事件(绘制的指示语操作)
      this.typeSelect = type; //获取绘制的状态
      this.map.removeInteraction(this.draw);
      this.addInteraction();
    },
    //指针移动时(添加绘制指示性语言)
    pointerMoveHandler(evt) {
      if (evt.dragging) {
        return;
      }
      const { sketch, continuePolygonMsg, continueLineMsg } = this;
      let helpMsg = '点击开始绘图';
      if (sketch) {
        const geom = sketch.getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = continuePolygonMsg;
        } else if (geom instanceof LineString) {
          helpMsg = continueLineMsg;
        }
      }
      this.helpTooltipElement.innerHTML = helpMsg;
      this.helpTooltip.setPosition(evt.coordinate);
      this.helpTooltipElement.classList.remove('hidden');
    },
    //返回测量距离
    formatLength(line) {
      const length = getLength(line);
      let output;
      if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
      } else {
        output = Math.round(length * 100) / 100 + ' ' + 'm';
      }
      return output;
    },
    //返回测量面积
    formatArea(polygon) {
      const area = getArea(polygon);
      let output;
      if (area > 10000) {
        output =
          Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
      } else {
        output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
      }
      return output;
    },
    //绘制
    addInteraction() {
      const type = this.typeSelect == 'area' ? 'Polygon' : 'LineString';
      this.draw = new Draw({
        source: this.source,
        type,
        //绘制中的样式
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            lineDash: [10, 10],
            width: 2,
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
              color: 'rgba(0, 0, 0, 0.7)',
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
          }),
        }),
      });
      this.createMeasureTooltip();
      this.createHelpTooltip(); //指示提示函数
      let listener;
      this.draw.on('drawstart', (evt) => {
        this.sketch = evt.feature;
        let tooltipCoord = evt.coordinate;
        listener = this.sketch.getGeometry().on('change', (evtSketch) => {
          const geom = evtSketch.target;
          let output;
          if (geom instanceof Polygon) {
            output = this.formatArea(geom);
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            output = this.formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
          }
          this.measureTooltipElement.innerHTML = output;
          this.measureTooltip.setPosition(tooltipCoord);
        });
      });

      this.draw.on('drawend', (evt) => {
        console.log(evt.feature.getGeometry().getCoordinates());
        this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
        this.measureTooltip.setOffset([0, -7]);
        this.sketch = null;
        // 取消设置工具提示以便创建新的工具提示
        this.measureTooltipElement = null;
        this.createMeasureTooltip();
        unByKey(listener);
      });
      this.map.addInteraction(this.draw);
    },
    //绘制中显示(提示绘制方式的函数)
    createHelpTooltip() {
      let that = this;
      if (this.helpTooltipElement) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
      }
      this.helpTooltipElement = document.createElement('div');
      this.helpTooltipElement.className = 'ol-tooltip hidden';
      this.helpTooltip = new Overlay({
        element: that.helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left',
      });
      this.map.addOverlay(this.helpTooltip);
    },
    /**
     * 创建一个新的度量工具提示(距离或者面积)
     */
    createMeasureTooltip() {
      if (this.measureTooltipElement) {
        this.measureTooltipElement.parentNode.removeChild(
          this.measureTooltipElement
        );
      }
      this.measureTooltipElement = document.createElement('div');
      this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
      this.measureTooltip = new Overlay({
        element: this.measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
      });
      this.map.addOverlay(this.measureTooltip);
    },
    // 清空
    onClear() {
      const dom = document.getElementsByClassName(
        'ol-tooltip ol-tooltip-static'
      );
      for (let k of Array.from(dom)) {
        k.remove();
      }
      this.source.clear();
      console.log(dom);
    },
  },
};
</script>

<style>
.map {
  width: 100%;
  height: 400px;
}
.ol-tooltip {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  opacity: 0.7;
  white-space: nowrap;
  font-size: 12px;
  cursor: default;
  user-select: none;
}
.ol-tooltip-measure {
  opacity: 1;
  font-weight: bold;
}
.ol-tooltip-static {
  background-color: #ffcc33;
  color: black;
  border: 1px solid white;
}
.ol-tooltip-measure:before,
.ol-tooltip-static:before {
  border-top: 6px solid rgba(0, 0, 0, 0.5);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: '';
  position: absolute;
  bottom: -6px;
  margin-left: -7px;
  left: 50%;
}
.ol-tooltip-static:before {
  border-top-color: #ffcc33;
}
</style>
