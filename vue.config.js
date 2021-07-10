module.exports = {
  publicPath:'',  //项目的静态路径
  lintOnSave:false,
  devServer:{
      host:'localhost',
      port:9090,
      // proxy:{
      //     //   /mock/cart.json
      //     '/mock':{
      //         target:'http://localhost:9090',
      //         ws:false,  //webSocket的一个简写，在这不需要
      //         changeOrigin:false  //将主机的原点改为目标URL
      //     }
      // }
  }
}