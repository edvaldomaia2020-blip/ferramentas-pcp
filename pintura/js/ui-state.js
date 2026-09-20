export const MOBILE_BREAKPOINT=700;
export const isMobileWidth=width=>Number(width)<=MOBILE_BREAKPOINT;
export function menuTransition(open,action,isMobile=true){if(!isMobile)return false;if(action==='toggle')return!open;if(action==='outside'||action==='navigate'||action==='escape')return false;return open;}
