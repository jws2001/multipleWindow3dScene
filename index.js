import Draw from "./draw.js";

const drawDom = document.querySelector('.draw');
const draw = new Draw(drawDom, './th.jpeg', 5);


const fun = () => {
    console.log('超出限制')
}

draw.addEventListener('limit', fun)


draw.removeEventListener('limit', fun)