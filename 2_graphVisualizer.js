import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import { cropToLargestConnectedComponent } from "graphology-components";
import circular from "graphology-layout/circular";
import Papa from "papaparse";
import louvain from 'graphology-communities-louvain';
import iwanthue from 'iwanthue';
import { degreeCentrality, inDegreeCentrality, outDegreeCentrality } from 'graphology-metrics/centrality/degree';
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector';


document.getElementById('drawGraphButton').addEventListener('click', drawGraph);

let graph;
let sigmaInstance;
let container;

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
        container = document.getElementById('sigma-container');
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
        const additionalControl = document.getElementById('additional-contents');
        additionalControl.style.display = 'flex';
        const centralityTable = document.getElementById('additional-contents-centrality');
        centralityTable.style.display = 'flex';

        if (additionalControl) {
            additionalControl.scrollIntoView({ behavior: 'smooth', block: 'start' }); // 스크롤을 부드럽게 처리하며 요소 상단에 맞춤
        }
    } else {
        errorDisplay.textContent = '불러온 CSV 데이터가 없습니다.';
        errorDisplay.style.visibility = 'visible'; // 오류 메시지 표시
    }
    if (centralityBody){
        centralityBody.innerHTML = ''; // 기존 내용 제거
    };
    if(communityBody){
        communityBody.innerHTML = ''; // 기존 내용 제거
    }

}


//Additional Graph Control
//all that buttons
const comDetectOn = document.getElementById('com-detect-on');
const comDetectOff = document.getElementById('com-detect-off');
const comIdentifier = document.getElementById('communities-identifier')
const comList = document.getElementById('community-table-panel')
const comLabel = document.getElementById('com-label')

comDetectOn.addEventListener('click', communityAssign);
comDetectOff.addEventListener('click', singleCommunity);
comIdentifier.addEventListener('click', markComList);
comLabel.addEventListener('click', labelCommunity);

let communitiesList;
let communityNodes;
let communityColors;

//Node에 커뮤니티 배정하기
function communityAssign(){
    comDetectOn.style.display = 'none';
    comDetectOff.style.display = 'block';
    comIdentifier.style.display = 'block';
    comLabel.style.display = 'block'
    
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
    communityColors = {};
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
    container = document.getElementById('sigma-container');
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
    comLabel.style.display = 'none';


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
        container = document.getElementById('sigma-container');
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

//커뮤니티에 소속된 노드들 표시하기 - communityAssign 함수에서 처리됨
let communityBody;
function updateCommunityNodes(communityNodes){
    communityBody = document.getElementById('community-body');
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

//Assign된 노드들 보여주기
function markComList(){
    comList.style.display = 'block';
    comIdentifier.style.display = 'none';
}

//그래프 위에 커뮤니티를 label하여 보여주자
function labelCommunity(){
    comLabel.style.display = 'none';

    //클러스터 정의
    const clusters = {};

    graph.forEachNode((node, atts) => {
        if (!clusters[atts.community]) {
          clusters[atts.community] = { label: atts.community, positions: [] };
        }
      });

    //클러스터별 색상 배정 - communityColors를 그대로 가져오자
    Object.keys(clusters).forEach((community, index) => {
        clusters[community].color = communityColors[index];
      });

    // 노드의 x,y 좌표를 clusters에 추가하기
    graph.forEachNode((node, atts) => {
        const cluster = clusters[atts.community];
        cluster.positions.push({ x: atts.x, y: atts.y });
    });

    // 클러스터의 노드 중심 계산
    Object.keys(clusters).forEach((community) => {
        const cluster = clusters[community];
        cluster.x = cluster.positions.reduce((acc, p) => acc + p.x, 0) / cluster.positions.length;
        cluster.y = cluster.positions.reduce((acc, p) => acc + p.y, 0) / cluster.positions.length;
    });

    // sigma 초기화
    sigmaInstance.kill();
    const renderer = new Sigma(graph, container);

    // 클러스터 라벨 레이어 생성
    const clustersLayer = document.createElement("div");
    clustersLayer.id = "clustersLayer";
    let clusterLabelsDoms = "";
    Object.keys(clusters).forEach((community) => {
        const cluster = clusters[community];
        const viewportPos = renderer.graphToViewport(cluster);
        clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="position:absolute; top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}; font-size: 20px; font-weight: bold; opacity: 0.5;">Community ${cluster.label}</div>`;
    });
    clustersLayer.innerHTML = clusterLabelsDoms;
    container.insertBefore(clustersLayer, document.getElementsByClassName("sigma-hovers")[0]);

    // 각 렌더 후 클러스터 라벨 위치 업데이트
    renderer.on("afterRender", () => {
        Object.keys(clusters).forEach((country) => {
        const cluster = clusters[country];
        const clusterLabel = document.getElementById(cluster.label);
        if (clusterLabel) {
            const viewportPos = renderer.graphToViewport(cluster);
            clusterLabel.style.top = `${viewportPos.y}px`;
            clusterLabel.style.left = `${viewportPos.x}px`;
        }
        });
    });

}

//중심성 계산하는 함수 만들기
const computeCen = document.getElementById('compute-cen')
const centralityDataTable = document.getElementById('centrality-table-panel');
const sortByDegree = document.getElementById('sort-by-degree');
const sortByEigen = document.getElementById('sort-by-eigen');

computeCen.addEventListener('click', computeCentrality);
sortByDegree.addEventListener('click',sortByDC);
sortByEigen.addEventListener('click', sortByEC);

let degreeCen;
let eigenCen;
let centralityBody;
let nodes = [];

function computeCentrality(){
    degreeCen = degreeCentrality(graph);
    Object.keys(degreeCen).forEach(node => {
        graph.setNodeAttribute(node, 'degreeCentrality', parseFloat(degreeCen[node].toFixed(3)));
      });
    sortByDegree.style.display = 'inline'
    // Eigenvector Centrality 계산 및 할당
    eigenCen;
    try {
      eigenCen = eigenvectorCentrality(graph);
      Object.keys(eigenCen).forEach(node => {
        graph.setNodeAttribute(node, 'eigenvectorCentrality', parseFloat(eigenCen[node].toFixed(3)));
      });
      sortByEigen.style.display = 'inline'
    } catch (error) {
        sortByEigen.style.display = 'none';
      console.error('Error calculating eigenvector centrality:', error);
      // Eigenvector centrality 계산 실패 시 각 노드에 'N/A' 할당
      graph.forEachNode(node => {
        graph.setNodeAttribute(node, 'eigenvectorCentrality', 'N/A');
      });
    }
    
    centralityBody = document.getElementById('centrality-body');
    centralityBody.innerHTML = ''; // 기존 내용 제거

    // 노드를 중심성 기준으로 정렬
    graph.forEachNode((node, attributes) => {
        nodes.push({
            node: node,
            degreeCentrality: attributes.degreeCentrality,
            eigenvectorCentrality: attributes.eigenvectorCentrality
        });
    });

    // 정렬: degreeCentrality를 우선, eigenvectorCentrality를 그 다음으로 기준
    nodes.sort((a, b) => {
        if (b.degreeCentrality !== a.degreeCentrality) {
            return b.degreeCentrality - a.degreeCentrality;
        } else {
            if (a.eigenvectorCentrality === 'N/A') return 1;
            if (b.eigenvectorCentrality === 'N/A') return -1;
            return b.eigenvectorCentrality - a.eigenvectorCentrality;
        }
    });

    // 상위 10개 노드 추출
    const top10Nodes = new Set(nodes.slice(0, 10).map(n => n.node));

    graph.forEachNode((node, attributes) => {
        const row = document.createElement('tr');
        const nodeCell = document.createElement('td');
        nodeCell.textContent = node;
        const degreeCell = document.createElement('td');
        degreeCell.textContent = attributes.degreeCentrality.toFixed(3);
        const eigenCell = document.createElement('td');
        eigenCell.textContent = attributes.eigenvectorCentrality === 'N/A' ? 'N/A' : attributes.eigenvectorCentrality.toFixed(3);
        row.appendChild(nodeCell);
        row.appendChild(degreeCell);
        row.appendChild(eigenCell);
        centralityBody.appendChild(row);
    });
    
    centralityDataTable.style.display = 'block';
};

function sortByDC(){
    centralityBody.innerHTML = ''; // 기존 내용 제거

    // 정렬: degreeCentrality를 우선, eigenvectorCentrality를 그 다음으로 기준
    nodes.sort((a, b) => {
        if (b.degreeCentrality !== a.degreeCentrality) {
            return b.degreeCentrality - a.degreeCentrality;
        } else {
            if (a.eigenvectorCentrality === 'N/A') return 1;
            if (b.eigenvectorCentrality === 'N/A') return -1;
            return b.eigenvectorCentrality - a.eigenvectorCentrality;
        }
    });

    // 상위 10개 노드 추출
    const top10Nodes = new Set(nodes.slice(0, 10).map(n => n.node));

    // 테이블에 데이터 추가
    nodes.forEach(({ node, degreeCentrality, eigenvectorCentrality }) => {
        const row = document.createElement('tr');

        // 상위 10개 노드에 대해 글씨와 테두리를 굵게 처리
        if (top10Nodes.has(node)) {
            row.style.fontWeight = 'bold';
            row.style.border = '2px solid black';
        }

        const nodeCell = document.createElement('td');
        nodeCell.textContent = node;
        const degreeCell = document.createElement('td');
        degreeCell.textContent = degreeCentrality.toFixed(3);
        const eigenCell = document.createElement('td');
        eigenCell.textContent = eigenvectorCentrality === 'N/A' ? 'N/A' : eigenvectorCentrality.toFixed(3);
        
        row.appendChild(nodeCell);
        row.appendChild(degreeCell);
        row.appendChild(eigenCell);
        centralityBody.appendChild(row);
    });    
};

function sortByEC(){
    centralityBody.innerHTML = ''; // 기존 내용 제거
    // 정렬: eigenvectorCentrality 우선, degreeCentrality를 다음으로 기준으로 함 
    nodes.sort((a, b) => {
        if (b.eigenvectorCentrality !== a.eigenvectorCentrality) {
            return b.eigenvectorCentrality - a.eigenvectorCentrality;
        } else {
            if (a.degreeCentrality === 'N/A') return 1;
            if (b.degreeCentrality === 'N/A') return -1;
            return b.degreeCentrality - a.degreeCentrality;
        }
    });

    // 상위 10개 노드 추출
    const top10Nodes = new Set(nodes.slice(0, 10).map(n => n.node));

    // 테이블에 데이터 추가
    nodes.forEach(({ node, degreeCentrality, eigenvectorCentrality }) => {
        const row = document.createElement('tr');

        // 상위 10개 노드에 대해 글씨와 테두리를 굵게 처리
        if (top10Nodes.has(node)) {
            row.style.fontWeight = 'bold';
            row.style.border = '2px solid black';
        }

        const nodeCell = document.createElement('td');
        nodeCell.textContent = node;
        const degreeCell = document.createElement('td');
        degreeCell.textContent = degreeCentrality.toFixed(3);
        const eigenCell = document.createElement('td');
        eigenCell.textContent = eigenvectorCentrality === 'N/A' ? 'N/A' : eigenvectorCentrality.toFixed(3);
        
        row.appendChild(nodeCell);
        row.appendChild(degreeCell);
        row.appendChild(eigenCell);
        centralityBody.appendChild(row);
    });    
};