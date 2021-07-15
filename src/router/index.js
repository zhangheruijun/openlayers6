import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/addPointImg',
    name: 'addPointImg',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/addPointImg.vue'),
  },
  {
    path: '/draw',
    name: 'draw',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/draw.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
