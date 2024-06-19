import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import { cropToLargestConnectedComponent } from "graphology-components";
import circular from "graphology-layout/circular";
import Papa from "papaparse";
import louvain from 'graphology-communities-louvain';

document.getElementById('drawGraphButton').addEventListener('click', drawGraph);

let graph;
let sigmaInstance;

function drawGraph() {
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.style.display = 'block';
    if (window.csvData && window.csvData.length > 0) {
        graph = new Graph();
        
        window.csvData.forEach(row => {
            const { Source1, Source2, Weight } = row;
            if (!graph.hasNode(Source1)) {
                graph.addNode(Source1, { label: Source1 });
            }
            if (!graph.hasNode(Source2)) {
                graph.addNode(Source2, { label: Source2 });
            }
            graph.addEdge(Source1, Source2, { size: Weight*2 });
        });

        //degree를 이용하여 노드 크기 조절
        const degrees = graph.nodes().map((node) => graph.degree(node));
        const minDegree = Math.min(...degrees);
        const maxDegree = Math.max(...degrees);
        const minSize = 2, maxSize = 10;
        graph.forEachNode((node) => {
            const degree = graph.degree(node);
            graph.setNodeAttribute(
              node,
              "size",
              minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
            );
          });
        
        //Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout:  
        circular.assign(graph);
        forceAtlas2.assign(graph, { iterations: 300 });

        // Clear previous graph if exists
        if (sigmaInstance) {
            sigmaInstance.kill();
            sigmaInstance = null;
        }
        
        // Sigma.js settings to enlarge node labels
        const container = document.getElementById('sigma-container');
        container.innerHTML = '';
        const settings = {
            labelFont: "Arial",
            //labelSize: 50, // Increase this value to make labels larger
            labelWeight: "bold", // Make labels bold
            defaultNodeLabelSize: 200, // Default label size for nodes
            labelSize: 'fixed'
        };

        sigmaInstance = new Sigma(graph, container, { settings });
        errorDisplay.style.visibility = 'hidden';
        const additionalControl = document.getElementById('additional-contents')
        additionalControl.style.display = 'flex'
    } else {
        errorDisplay.textContent = '불러온 CSV 데이터가 없습니다.';
        errorDisplay.style.visibility = 'visible'; // 오류 메시지 표시
    }
}


//Additional Graph Control
const comDetectOn = document.getElementById('com-detect-on');
const comDetectOff = document.getElementById('com-detect-off');
const comIdentifier = document.getElementById('communities-identifier')
const comList = document.getElementById('community-table-panel')

comDetectOn.addEventListener('click', communityAssign);
comDetectOff.addEventListener('click', singleCommunity);
comIdentifier.addEventListener('click', markComList);

let communitiesList;
let communityNodes;

//Node에 커뮤니티 배정하기
function communityAssign(){
    comDetectOn.style.display = 'none';
    comDetectOff.style.display = 'block';
    comIdentifier.style.display = 'block';
    
    //communities detection
    communitiesList = louvain(graph); //assign으로 direct assign 가능
    louvain.assign(graph);

    // 커뮤니티 ID를 수집
    const communitiesCount = new Set();
    graph.forEachNode((node, attributes) => {
        communitiesCount.add(attributes.community);
    });

    communityNodes = {};
    graph.forEachNode((node, attributes) => {
        const community = attributes.community;
        if (!communityNodes[community]) {
            communityNodes[community] = [];
        }
        communityNodes[community].push(node);
    });


    // 임의의 색상 생성 함수
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // 커뮤니티에 임의의 색상 배정
    const communityColors = {};
    let colorIndex = 0;
    communitiesCount.forEach(community => {
        communityColors[community] = getRandomColor();
    });

    // 노드에 색상 할당
    graph.forEachNode((node, attributes) => {
        const community = attributes.community;
        graph.setNodeAttribute(node, 'color', communityColors[community]);
    });
    
    //Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout:  
    circular.assign(graph);
    forceAtlas2.assign(graph, { iterations: 300 });

    // Clear previous graph if exists
    if (sigmaInstance) {
        sigmaInstance.kill();
        sigmaInstance = null;
    }
    
    // Sigma.js settings to enlarge node labels
    const container = document.getElementById('sigma-container');
    container.innerHTML = '';
    const settings = {
        labelFont: "Arial",
        //labelSize: 50, // Increase this value to make labels larger
        labelWeight: "bold", // Make labels bold
        defaultNodeLabelSize: 200, // Default label size for nodes
        labelSize: 'fixed'
    };

    sigmaInstance = new Sigma(graph, container, { settings });

    updateCommunityNodes(communityNodes);


}

//그래프에 커뮤니티 색 구분 해제
function singleCommunity(){
    comDetectOn.style.display = 'block';
    comDetectOff.style.display = 'none';
    comIdentifier.style.display = 'none';
    comList.style.display = 'none';


        // 노드에 색상 할당
        graph.forEachNode((node, attributes) => {
            const community = attributes.community;
            graph.setNodeAttribute(node, 'color', 'gray');
        });
        
        //Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout:  
        circular.assign(graph);
        forceAtlas2.assign(graph, { iterations: 300 });
    
        // Clear previous graph if exists
        if (sigmaInstance) {
            sigmaInstance.kill();
            sigmaInstance = null;
        }
        
        // Sigma.js settings to enlarge node labels
        const container = document.getElementById('sigma-container');
        container.innerHTML = '';
        const settings = {
            labelFont: "Arial",
            //labelSize: 50, // Increase this value to make labels larger
            labelWeight: "bold", // Make labels bold
            defaultNodeLabelSize: 200, // Default label size for nodes
            labelSize: 'fixed'
        };
    
        sigmaInstance = new Sigma(graph, container, { settings });
}

function updateCommunityNodes(communityNodes){
    console.log(communitiesList);
    const communityBody = document.getElementById('community-body');
    communityBody.innerHTML = ''; // 기존 내용 제거

    Object.keys(communityNodes).forEach(community => {
        const row = document.createElement('tr');
        const communityCell = document.createElement('td');
        communityCell.textContent = community;
        const nodesCell = document.createElement('td');
        nodesCell.textContent = communityNodes[community].join(', ');
        row.appendChild(communityCell);
        row.appendChild(nodesCell);
        communityBody.appendChild(row);
    });
}

function markComList(){
    comList.style.display = 'block';
    comIdentifier.style.display = 'none';
}