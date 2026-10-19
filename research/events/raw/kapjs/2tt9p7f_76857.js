(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,38456,t=>{"use strict";var e=t.i(28731),a=t.i(36818),r=t.i(84240),i=t.i(92420);let s=(0,t.i(40672).default)("MuiBox",["root"]),n=(0,r.createTheme)(),o=(0,e.createBox)({themeId:i.default,defaultTheme:n,defaultClassName:s.root,generateClassName:a.unstable_ClassNameGenerator.generate});t.s(["Box",0,o],38456)},46347,t=>{"use strict";var e=t.i(71645),a=t.i(7670),r=t.i(19130),i=t.i(67239),s=t.i(84364),n=t.i(61722),o=t.i(50915),l=t.i(99844),u=t.i(40672),d=t.i(19727);function h(t){return(0,d.default)("MuiSkeleton",t)}(0,u.default)("MuiSkeleton",["root","text","rectangular","rounded","circular","pulse","wave","withChildren","fitContent","heightAuto"]);var f=t.i(43476);let p=s.keyframes`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,c=s.keyframes`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`,m="string"!=typeof p?s.css`
        animation: ${p} 2s ease-in-out 0.5s infinite;
      `:null,g="string"!=typeof c?s.css`
        &::after {
          animation: ${c} 2s linear 0.5s infinite;
        }
      `:null,x=(0,n.styled)("span",{name:"MuiSkeleton",slot:"Root",overridesResolver:(t,e)=>{let{ownerState:a}=t;return[e.root,e[a.variant],!1!==a.animation&&e[a.animation],a.hasChildren&&e.withChildren,a.hasChildren&&!a.width&&e.fitContent,a.hasChildren&&!a.height&&e.heightAuto]}})((0,o.default)(({theme:t})=>{let e=String(t.shape.borderRadius).match(/[\d.\-+]*\s*(.*)/)[1]||"px",a=parseFloat(t.shape.borderRadius);return{display:"block",backgroundColor:t.vars?t.vars.palette.Skeleton.bg:(0,i.alpha)(t.palette.text.primary,"light"===t.palette.mode?.11:.13),height:"1.2em",variants:[{props:{variant:"text"},style:{marginTop:0,marginBottom:0,height:"auto",transformOrigin:"0 55%",transform:"scale(1, 0.60)",borderRadius:`${a}${e}/${Math.round(a/.6*10)/10}${e}`,"&:empty:before":{content:'"\\00a0"'}}},{props:{variant:"circular"},style:{borderRadius:"50%"}},{props:{variant:"rounded"},style:{borderRadius:(t.vars||t).shape.borderRadius}},{props:({ownerState:t})=>t.hasChildren,style:{"& > *":{visibility:"hidden"}}},{props:({ownerState:t})=>t.hasChildren&&!t.width,style:{maxWidth:"fit-content"}},{props:({ownerState:t})=>t.hasChildren&&!t.height,style:{height:"auto"}},{props:{animation:"pulse"},style:m||{animation:`${p} 2s ease-in-out 0.5s infinite`}},{props:{animation:"wave"},style:{position:"relative",overflow:"hidden",WebkitMaskImage:"-webkit-radial-gradient(white, black)","&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(t.vars||t).palette.action.hover},
                transparent
              )`,content:'""',position:"absolute",transform:"translateX(-100%)",bottom:0,left:0,right:0,top:0}}},{props:{animation:"wave"},style:g||{"&::after":{animation:`${c} 2s linear 0.5s infinite`}}}]}})),v=e.forwardRef(function(t,e){let i=(0,l.useDefaultProps)({props:t,name:"MuiSkeleton"}),{animation:s="pulse",className:n,component:o="span",height:u,style:d,variant:p="text",width:c,...m}=i,g={...i,animation:s,component:o,variant:p,hasChildren:!!m.children},v=(t=>{let{classes:e,variant:a,animation:i,hasChildren:s,width:n,height:o}=t;return(0,r.default)({root:["root",a,i,s&&"withChildren",s&&!n&&"fitContent",s&&!o&&"heightAuto"]},h,e)})(g);return(0,f.jsx)(x,{as:o,ref:e,className:(0,a.default)(v.root,n),ownerState:g,...m,style:{width:c,height:u,...d}})});t.s(["default",0,v],46347)},84240,t=>{"use strict";var e=t.i(58852);t.s(["createTheme",()=>e.default])},28731,36818,t=>{"use strict";var e=t.i(71645),a=t.i(7670),r=t.i(81851),i=t.i(17028),s=t.i(39416),n=t.i(61801),o=t.i(43476);t.s(["createBox",0,function(t={}){let{themeId:l,defaultTheme:u,defaultClassName:d="MuiBox-root",generateClassName:h}=t,f=(0,r.default)("div",{shouldForwardProp:t=>"theme"!==t&&"sx"!==t&&"as"!==t})(i.default);return e.forwardRef(function(t,e){let r=(0,n.default)(u),{className:i,component:p="div",...c}=(0,s.extendSxProp)(t);return(0,o.jsx)(f,{as:p,ref:e,className:(0,a.default)(i,h?h(d):d),theme:l&&r[l]||r,...c})})}],28731);var l=t.i(32123);t.s(["unstable_ClassNameGenerator",()=>l.default],36818)},39416,t=>{"use strict";var e=t.i(76423),a=t.i(79638);t.s(["extendSxProp",0,function(t){let r,i,s,{sx:n,...o}=t,{systemProps:l,otherProps:u}=(i={systemProps:{},otherProps:{}},s=o?.theme?.unstable_sxConfig??a.default,Object.keys(o).forEach(t=>{s[t]?i.systemProps[t]=o[t]:i.otherProps[t]=o[t]}),i);return r=Array.isArray(n)?[l,...n]:"function"==typeof n?(...t)=>{let a=n(...t);return(0,e.isPlainObject)(a)?{...l,...a}:l}:{...l,...n},{...u,sx:r}}],39416)},61801,86931,t=>{"use strict";var e=t.i(17494),a=t.i(71645),r=t.i(28419);let i=function(t=null){let e=a.useContext(r.ThemeContext);return e&&0!==Object.keys(e).length?e:t};t.s(["default",0,i],86931);let s=(0,e.default)();t.s(["default",0,function(t=s){return i(t)}],61801)},48304,t=>{"use strict";var e=t.i(43476),a=t.i(38456),r=t.i(46347),r=r,i=t.i(57688),s=t.i(18566);t.s(["default",0,({err:t=!1})=>(t&&(0,s.notFound)(),(0,e.jsxs)(a.Box,{sx:{position:"fixed",inset:0,zIndex:9999,width:"100vw",height:"100vh",bgcolor:"#f0f0f0"},children:[(0,e.jsx)(r.default,{variant:"rectangular",width:"100%",height:"100%",animation:"wave",sx:{bgcolor:"#e0e0e0","&::after":{background:"linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)"}}}),(0,e.jsx)(a.Box,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)"},children:(0,e.jsx)(i.default,{width:100,height:100,className:"w-[100px] h-[100px] object-contain",src:"/images/gifload.gif",alt:"Loading",unoptimized:!0})})]}))],48304)}]);