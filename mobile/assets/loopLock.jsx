import Svg, { Path } from 'react-native-svg';

export default function LoopLock(props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" {...props}>
      <Path fill="#ffffff" d="M208 312v32h112v-32h-40V176h-32v24h-32v32h32v80h-40z"></Path><Path fill="#ffffff" d="M464 210.511V264a112.127 112.127 0 0 1-112 112H78.627l44.686-44.687l-22.626-22.626L56 353.373l-4.415 4.414l-33.566 33.567l74.022 83.276l23.918-21.26L75.63 408H352c79.4 0 144-64.6 144-144v-85.489Z"></Path><Path fill="#ffffff" d="M48 256a112.127 112.127 0 0 1 112-112h273.373l-44.686 44.687l22.626 22.626L456 166.627l4.117-4.116l33.864-33.865l-74.022-83.276l-23.918 21.26L436.37 112H160c-79.4 0-144 64.6-144 144v85.787l32-32Z"></Path>
    </Svg>
  );
}
