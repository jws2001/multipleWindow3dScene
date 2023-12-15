import Draw from "./draw.js";

const drawDom = document.querySelector('.draw');
const draw = new Draw(drawDom, './手机壁纸-bizihu.com.JPG');


const fun = () => {
    console.log('超出限制')
}

draw.addEventListener('limit', fun)

draw.addEventListener('change', e => {
    console.log(e,'===')
})
