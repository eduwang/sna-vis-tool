// 노드 리스트 보여주는 코드
// document.getElementById('drawGraphButton').addEventListener('click', displaySource1Values);
// function displaySource1Values() {
//     const source1ValuesDisplay = document.getElementById('sigma-container');
//     source1ValuesDisplay.style.display = 'block';
//     if (window.csvData && window.csvData.length > 0) {
//         const uniqueSource1Values = [...new Set(window.csvData.map(row => row.Source1))];
//         source1ValuesDisplay.textContent = uniqueSource1Values.join(', ');
//     } else {
//         source1ValuesDisplay.textContent = '불러온 CSV 데이터가 없습니다.';
//     }
// }

import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import { cropToLargestConnectedComponent } from "graphology-components";
import circular from "graphology-layout/circular";
import Papa from "papaparse";

document.getElementById('drawGraphButton').addEventListener('click', drawGraph);

function drawGraph() {
    const source1ValuesDisplay = document.getElementById('source1ValuesDisplay');
    source1ValuesDisplay.style.display = 'block';
    if (window.csvData && window.csvData.length > 0) {
        const graph = new Graph();
        
        window.csvData.forEach(row => {
            const { Source1, Source2, Weight } = row;
            if (!graph.hasNode(Source1)) {
                graph.addNode(Source1, { label: Source1 });
            }
            if (!graph.hasNode(Source2)) {
                graph.addNode(Source2, { label: Source2 });
            }
            graph.addEdge(Source1, Source2, { size: Weight });
        });

        circular.assign(graph);

        forceAtlas2.assign(graph, { iterations: 100 });

        new Sigma(graph, document.getElementById('sigma-container'));

    } else {
        source1ValuesDisplay.textContent = '불러온 CSV 데이터가 없습니다.';
    }
}
