import message from "./objects/message";
import code from "./objects/code";
import menu from "./objects/menu";
import view from "./objects/view";
import keyboard from "./objects/keyboard";
import bpf from "./objects/bpf";
import waveform from "./objects/waveform";
import NumberBox from "./objects/number";
import img from "./objects/img";
import slider from "./objects/slider";
import multislider from "./objects/multislider";
import ptext from "./objects/text";
import video from "./objects/video";
import "./ui/ui.scss"

export default async () => ({
    message,
    code,
    menu,
    view,
    keyboard,
    bpf,
    waveform,
    img,
    number: NumberBox,
    slider,
    multislider,
    ptext,
    video
});
