(this["webpackJsonpalf-cdk-ui"]=this["webpackJsonpalf-cdk-ui"]||[]).push([[0],{1378:function(e,n,t){"use strict";t.r(n);var o=t(0),c=t.n(o),a=t(146),s=t.n(a),r=(t(303),t(266)),i=t(267),u=t(295),f=t(293),l=(t(304),t(268)),p=(t(976),t(292)),g=t(105),h={aws_project_region:"us-east-1",aws_cognito_identity_pool_id:"us-east-1:64e2db0e-ac01-4b72-96c4-eea02623f02b",aws_cognito_region:"us-east-1",aws_user_pools_id:"us-east-1_8c1pujn9g",aws_user_pools_web_client_id:"39be0fqctitbmhp1mba6et2ofu",oauth:{}},d=t(159);g.b.configure(h);var b,_="no",w=function(e){Object(u.a)(t,e);var n=Object(f.a)(t);function t(e){var o;return Object(r.a)(this,t),o=n.call(this,e),g.a.currentAuthenticatedUser({bypassCache:!1}).then((function(e){b=e.username,console.log(b)})).catch((function(e){return console.log(e)})),g.a.currentSession().then((function(e){var n=e.getAccessToken();_=n.getJwtToken(),console.log("myAccessToken: ".concat(JSON.stringify(n))),console.log("myJwt: ".concat(_));var t=new d.Configuration({accessToken:_,basePath:"https://api.alfpro.net"});new d.InstancesConfApi(t).getInstanceConfs(void 0,{headers:{Authorization:_}}).then((function(e){console.log("getInstanceConfs succeeded"),e.data.forEach((function(e){console.log("instanceConf: ".concat(JSON.stringify(e)))}))}))})),o}return Object(i.a)(t,[{key:"render",value:function(){return c.a.createElement("div",{className:"App"},c.a.createElement(l.a,{url:"https://api-explorer.alfpro.net/swagger.json",requestInterceptor:function(e){return e.headers.Authorization="".concat(_),e}}))}}]),t}(o.Component),m=Object(p.a)(w,!0),k=document.getElementById("root");s.a.render(c.a.createElement(m,null),k)},145:function(e,n){},298:function(e,n,t){e.exports=t(1378)},303:function(e,n,t){},304:function(e,n,t){},966:function(e,n){},968:function(e,n){}},[[298,1,2]]]);
//# sourceMappingURL=main.4867c1ec.chunk.js.map