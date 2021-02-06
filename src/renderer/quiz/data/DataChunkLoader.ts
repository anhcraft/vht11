import {Utils} from "../../utils/Utils";

const cache: any[] = [];

import data1 from "./data.1.json";
cache.push(data1);
import data2 from "./data.2.json";
cache.push(data2);
import data3 from "./data.3.json";
cache.push(data3);
import data4 from "./data.4.json";
cache.push(data4);
import data5 from "./data.5.json";
cache.push(data5);
import data6 from "./data.6.json";
cache.push(data6);
import data7 from "./data.7.json";
cache.push(data7);
import data8 from "./data.8.json";
cache.push(data8);
import data9 from "./data.9.json";
cache.push(data9);
import data10 from "./data.10.json";
cache.push(data10);
import data11 from "./data.11.json";
cache.push(data11);
import data12 from "./data.12.json";
cache.push(data12);
import data13 from "./data.13.json";
cache.push(data13);
import data14 from "./data.14.json";
cache.push(data14);
import data15 from "./data.15.json";
cache.push(data15);
import data16 from "./data.16.json";
cache.push(data16);
import data17 from "./data.17.json";
cache.push(data17);
import data18 from "./data.18.json";
cache.push(data18);
import data19 from "./data.19.json";
cache.push(data19);
import data20 from "./data.20.json";
cache.push(data20);
import data21 from "./data.21.json";
cache.push(data21);
import data22 from "./data.22.json";
cache.push(data22);
import data23 from "./data.23.json";
cache.push(data23);
import data24 from "./data.24.json";
cache.push(data24);
import data25 from "./data.25.json";
cache.push(data25);

const indexes: Map<string, number[]> = new Map<string, number[]>();

function generateIndexes(namespace: string): number[] {
    const arr: number[] = [];
    for(let i = 0; i < cache.length; i++){
        arr.push(i);
    }
    Utils.shuffleArray(arr);
    indexes.set(namespace, arr);
    return arr;
}

export function getDataChunk(namespace: string): any{
    let index: number[];
    if(indexes.has(namespace)) {
        const v = indexes.get(namespace);
        if(v !== undefined) {
            index = v;
        } else {
            index = generateIndexes(namespace);
        }
    } else {
        index = generateIndexes(namespace);
    }
    const first = index.shift();
    if(first == undefined) {
        return [];
    }
    if(index.length == 0){
        indexes.delete(namespace);
    }
    return cache[first].data;
}
