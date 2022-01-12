/* eslint-disable linebreak-style */
/* eslint-disable no-restricted-syntax */

const webPath = 'http://localhost:8001/'
//const webPath = 'https://fma-small-dataset-song-matcher.herokuapp.com/'

var edgelabels, pairing_nodes = {};

//Drag func. for the force simulation graph.
drag = simulation => {
  
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }
      
      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function checkForMismatchInFiles(nodes_main, edges_main){
    let error_flag = 0;
    let missing_nodes = [];
    let nodes_temp_json = JSON.parse(JSON.stringify(nodes_main.map(e => e['node'])))
    edges_main.forEach(e => {
        if(!(nodes_temp_json.includes(e.from) && nodes_temp_json.includes(e.to))){
            missing_nodes.push(nodes_temp_json.includes(e.from) ? e.to : e.from)
            missing_nodes.push(nodes_temp_json.includes(e.to) ? e.from : e.to)
            error_flag = 1;
        }
    })
    if(error_flag){
        missing_nodes = [...new Set(missing_nodes)];
        alert("Mismatching node and edges files. Missing nodes found in the edges file: " + missing_nodes.join());
        edges_main = [];
        $('#uploadedgebtn').attr("disabled", false);
        displayStateMachine(nodes_main, edges_main);
    }

}

/**
 * This is the main display function for the DTMC.
 * @param {Nodes to be presented on the graph.} nodes_main 
 * @param {Edges to be presented on the graph.} edges_main 
 * @returns 
 */
function displayStateMachine(nodes_main,edges_main) {

    //Check for mismatch between nodes and edges files.
    checkForMismatchInFiles(nodes_main, edges_main);

    // Normal Flow
    const links = [];
    const nodes = [];
    //Create paths for each of the edges in the file.
    for (let i = 0; i < edges_main.length; i++) {
        const link = {
            source: edges_main[i].from,
            target: edges_main[i].to,
            value: 50, //Defines the distance between the nodes.
            label: edges_main[i].label
        };
        //Extract paired nodes
        try{
            links.forEach((link_ele) => {
                if(((edges_main[i].from == link_ele.__proto__.target && 
                            edges_main[i].to == link_ele.__proto__.source) 
                                                ||                 
                        (edges_main[i].from == link_ele.__proto__.source &&
                            edges_main[i].to == link_ele.__proto__.target)) 
                        && 
                        edges_main[i].from != edges_main[i].to)
                        {
                    if(edges_main[i].from == link_ele.__proto__.source && edges_main[i].to == link_ele.__proto__.target){
                            if(!pairing_nodes[edges_main[i].to + '-' + edges_main[i].from]){
                                pairing_nodes[edges_main[i].to + '-' + edges_main[i].from] = 1;
                            }
                            if(pairing_nodes[edges_main[i].from + '-' + edges_main[i].to])
                            {
                                pairing_nodes[edges_main[i].from + '-' + edges_main[i].to] =
                                pairing_nodes[edges_main[i].from + '-' + edges_main[i].to] + 1;
                                throw 'break';
                            }
                            pairing_nodes[edges_main[i].from + '-' + edges_main[i].to] = 1;
                        }
                        else
                        {
                            if(!pairing_nodes[edges_main[i].to + '-' + edges_main[i].from]){
                                pairing_nodes[edges_main[i].to + '-' + edges_main[i].from] = 1;
                            }
                            if(!pairing_nodes[edges_main[i].from + '-' + edges_main[i].to]){
                                pairing_nodes[edges_main[i].from + '-' + edges_main[i].to] = 1;
                            }
                        }
                    }       
                })
            }
        catch(e){}
        //Finally push the node into the object.
        links.push(Object.create(link));
    }

    //Create nodes for each of the nodes in the file.
for (let i = 0; i < nodes_main.length; i++) {
    let node_temp = {
        node_name: nodes_main[i].node
    };
    nodes.push(Object.create(node_temp));
    }

    const nodeclicked = function (d) {
        d3.selectAll(".node" ).classed("selectedNode", false);
        $('.js-example-basic-multiple').val(null).trigger('change');

        d3.selectAll(".node" ).classed("node", true);
        d3.selectAll("#node_" + d.__proto__.node_name).classed("selectedNode", true);
        $('.edgeselector').show();
        $('#deleteEdgeEnable').hide();
        nodes_main.forEach(e => {
            $('.js-example-basic-multiple').append('<option value="' + e['node'] + '">' + e['node'] + '</option>')
        })
            $('.js-example-basic-multiple').select2({
                placeholder: "Select Nodes...",
                allowClear: true
            });
       d3.selectAll("path" ).classed("selectedEdge", false);
       d3.selectAll("path" ).classed("hoveredEdge", false);
       setTimeout(() => {
        $('svg').off('click').on('click', function(e){
            e.preventDefault();           
            if(e.target.tagName == 'path' || e.target.tagName == 'textPath'){
                setTimeout(() => {
                    d3.selectAll(".node" ).classed("selectedNode", false);
                    $('.edgeselector').hide();
                })
            }else if(e.target.tagName == 'circle' || e.target.tagName == 'text'){
                setTimeout(() => {
                    d3.selectAll("path" ).classed("selectedEdge", false);
                    d3.selectAll("path" ).classed("hoveredEdge", false);
                })
            }else{
                d3.selectAll(".node" ).classed("selectedNode", false);
                d3.selectAll("path" ).classed("selectedEdge", false);
                d3.selectAll("path" ).classed("hoveredEdge", false);
                $('.edgeselector').hide();
                }
            $('svg').off('click');
        })
       })

    }
    
    const edgeclicked = function (d) {
        index_holder = d.index;
        d3.selectAll("path" ).attr("class", "");
        d3.selectAll("#link_" + edges_main[d.index]['from'] + "-" + edges_main[d.index]['to']).classed("selectedEdge", true);
        $('.edgeselector').hide();
        $('#deleteEdgeEnable').show();
        d3.selectAll(".node" ).classed("selectedNode", false);

        setTimeout(() => {
            $('svg').off('click').on('click', function(e) {
                e.preventDefault(); 
                if(e.target.tagName == 'circle'){
                    setTimeout(() => {
                        d3.selectAll("path" ).classed("selectedEdge", false);
                        d3.selectAll("path" ).classed("hoveredEdge", false);
                        $('#deleteEdgeEnable').hide();                    })
                }else if(e.target.tagName == 'path' || e.target.tagName == 'textPath'){
                    setTimeout(() => {
                        d3.selectAll(".node" ).classed("selectedNode", false);                    })
                }else{
                    d3.selectAll("path" ).classed("selectedEdge", false);
                    d3.selectAll("path" ).classed("hoveredEdge", false);
                    d3.selectAll(".node" ).classed("selectedNode", false);
                    $('#deleteEdgeEnable').hide();
                }
                $('svg').off('click');
                 })
           })
    }

//Dimensions for the scatterplot.
const width = $('#scatterplot').outerWidth();
const height = $('#scatterplot').outerHeight();
d3.select('#scatterplot').html("");
const svg = d3.select('#scatterplot').append('svg')
    .attr('width', width)
    .attr('height', height);

//Tooltip func. for the simulation graph.
const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('background-color', 'white')
    .style('color', 'black')
    .style('border', 'solid')
    .style('border-width', '4px')
    .style('border-radius', '6px')
    .style('padding', '10px')
    .style('position', 'absolute');

const mouseover = function (d) {
    tooltip
        .style('opacity', 1);
    d3.select(this)
        .classed("hoveredNode", true);
};

const mousemove = function (d) {
    let html = '';
    html = `${`Name: ${d.__proto__.node_name}<br>`}`;
    tooltip
        .html(html)
        .style('left', d3.event.pageX + 10 +'px')
        .style('top', d3.event.pageY + 10 +'px');
};

const mouseleave = function (d) {
    tooltip
        .style('opacity', 0);
    d3.select(this)
        .classed("hoveredNode", false);
};
       
    let defs =  svg
    .append('defs');
     
    links.forEach(link => {
    defs.append('marker')
    .attr('id', 'arrow_' + link.__proto__.source + '-' + link.__proto__.target + '_' + link.__proto__.cardinality)
    .attr('viewBox', [0, 0, 12, 12])
    .attr('markerUnits', 'strokeWidth')
    .attr('refX', 25)
    .attr('refY', 6)
    .attr('xoverflow', 'visible')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', "M2,2 L10,6 L2,10 L6,6 L2,2")
    .attr('fill', '#0d6efd');
    });
    svg
    .append('defs')
    .append('marker')
    .attr('id', 'arrow_self')
    .attr('viewBox', [0, 0, 12, 12])
    .attr('markerUnits', 'strokeWidth')
    .attr('refX', 15)
    .attr('refY', 5)
    .attr('xoverflow', 'visible')
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', "M2,2 L10,6 L2,10 L6,6 L2,2")
    .attr('fill', '#0d6efd');

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).distance(150)
        .id(d => d.node_name))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    let temp_pairing_links = JSON.parse(JSON.stringify(pairing_nodes));
    const link = svg.append('g')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 1)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('id', function (d, i) {return 'link_' + d.source.node_name + "-" + d.target.node_name})
        .attr('stroke-width', 2)
        .attr('marker-end', (d,i) => {
            if(d.source.node_name == d.target.node_name){
                return 'url(#arrow_self)';
            }else{
                if(pairing_nodes[d.source.node_name + '-' + d.target.node_name]){
                    temp_pairing_links[d.source.node_name + '-' + d.target.node_name] = temp_pairing_links[d.source.node_name + '-' + d.target.node_name] - 1;
                    return 'url(#arrow_' + d.source.node_name + '-' + d.target.node_name + '_' + (temp_pairing_links[d.source.node_name + '-' + d.target.node_name] + 1) + ')';
                }
                return 'url(#arrow_' + d.source.node_name + '-' + d.target.node_name + ')';
            }
        } )
        .style('fill', 'transparent')
        .style('stroke', '#0d6efd')
        .on('click', edgeclicked)
        .on('mouseover', function(d) {
            d3.select(this).classed('hoveredEdge', true)
        })
        .on('mouseleave', function(d) {
            d3.select(this).classed('hoveredEdge', false)
        });

    edgelabels = svg.selectAll(".edgelabel")
        .data(links)
        .enter()
        .append('text')
        .style("pointer-events", "auto")
        .attr('class', 'edgelabel')
        .attr('id', function (d, i) {return 'edgelabel' + i})
        .attr("dy", -5)
        .attr('font-size', 14)
        .attr('fill', '#000')
        .on('click', edgeclicked)
        .on('mouseover', function(d) {
            d3.selectAll("#link_" + edges_main[d.index]['from'] + "-" + edges_main[d.index]['to']).classed("hoveredEdge", true)
        })
        .on('mouseleave', function(d) {
            d3.selectAll("#link_" + edges_main[d.index]['from'] + "-" + edges_main[d.index]['to']).classed("hoveredEdge", false)
        });

    edgelabels.append('textPath')
        .attr('xlink:href', function (d, i) {return '#link_' + d.source.node_name + "-" + d.target.node_name})
        .style("text-anchor", "left")
        .style("pointer-events", "auto")
        .attr("startOffset", "30%")
        .text(d => d.label);


    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .attr("stroke","black")
        .style('pointer-events', 'auto')
        .style("fill", "#a3c5f7") 
        .attr('id', d =>  "node_"+d.node_name)
        .call(drag(simulation))

    node.append("svg:circle")
        .attr("class", "node")
        .style('pointer-events', 'auto')
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("r", 30)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
        .on('click', nodeclicked);


    node.append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", 1)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .on('click', nodeclicked)
        .text(function(d) { return d.node_name })
        .attr("class", "nodetext1")
        .style('pointer-events', 'auto')
        .on('mouseover', function(d) {
            tooltip
                .style('opacity', 1);
            d3.select("#node_" + (d.index+1)).classed("hoveredNode", true)
        })
        .on('mousemove', mousemove)
        .on('mouseleave', function(d) {
            tooltip
                .style('opacity', 0);
            d3.select("#node_" + (d.index+1)).classed("hoveredNode", false)
    });
     
    simulation.on('tick', () => {
        let temp_cardinalities = JSON.parse(JSON.stringify(pairing_nodes));
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr("d", function(d) {
        var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        dx = x2 - x1,
        dy = y2 - y1,
        dr = Math.sqrt(dx * dx + dy * dy),
        drx = 0,
        dry = 0;
    if(temp_cardinalities[d.source.node_name+'-'+d.target.node_name]){
            let cardinality = temp_cardinalities[d.source.node_name+'-'+d.target.node_name];
            drx = 2*dr/cardinality
            dry = 2*dr/cardinality
            temp_cardinalities[d.source.node_name+'-'+d.target.node_name] = temp_cardinalities[d.source.node_name+'-'+d.target.node_name] - 1;
        }
                    
        var xRotation = 0, // degrees
        largeArc = 0, // 1 or 0
        sweep = 1; // 1 or 0
            
                    // Self edge.
    if ( x1 === x2 && y1 === y2 ) {
            // Fiddle with this angle to get loop oriented.
            xRotation = -45;

            // Needs to be 1.
            largeArc = 1;

            // Change sweep to change orientation of loop. 
            //   sweep = 90;

            // Make drx and dry different to get an ellipse
            // instead of a circle.
            drx = 55;
            dry = 15;

            // For whatever reason the arc collapses to a point if the beginning
            // and ending points of the arc are the same, so kludge it.
            x2 = x2 + 20;
            y2 = y2 + 5;
        } 
            
        return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
    });

    edgelabels.attr('transform',function(d,i){
    if (d.target.x<d.source.x){
        bbox = this.getBBox();
        rx = bbox.x+bbox.width/2;
        ry = bbox.y+bbox.height/2;
        return 'rotate(180 '+rx+' '+ry+')';
    }
    else {
    return 'rotate(0)';
    }
    });


    node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);      
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
    return svg.node();
}

function deleteEdge(){
    global_edges.splice(index_holder, 1);
    $('#deleteEdgeEnable').hide();
     displayStateMachine(global_nodes, global_edges);
}

function addEdge(){
    if($('.js-example-basic-multiple').val().length > 0){
        $('.js-example-basic-multiple').val().forEach(e => {
            let to = e;
            let from = $('.selectedNode').attr('id');
            let split = from.split('_');
            global_edges.push({from: split[1]+'', to: to+'', label: '1/2'})
           

        })
        displayStateMachine(global_nodes, global_edges);
        $('.edgeselector').hide();
    }
}

function deleteNode(){
    let from = $('.selectedNode').attr('id');
    let split = from.split('_');
    let node = split[1];
    global_nodes = global_nodes.filter(e => e.node != '' + node);
    global_edges = global_edges.filter(e => {
        return e['from'] != ''+node && e['to'] != ''+node
    })
    $('.edgeselector').hide();
    displayStateMachine(global_nodes, global_edges);
}


$('#addnode').on('click', () =>{
    if($('#node_name').val()){
        global_nodes.push({node: $('#node_name').val()});
        displayStateMachine(global_nodes, global_edges);
    }
    
});

function positionLink(d) {
    var offset = 30;

    var midpoint_x = (d.source.x + d.target.x) / 2;
    var midpoint_y = (d.source.y + d.target.y) / 2;

    var dx = (d.target.x - d.source.x);
    var dy = (d.target.y - d.source.y);

    var normalise = Math.sqrt((dx * dx) + (dy * dy));

    var offSetX = midpoint_x + offset*(dy/normalise);
    var offSetY = midpoint_y - offset*(dx/normalise);

    return "M" + d.source.x + "," + d.source.y +
        "S" + offSetX + "," + offSetY +
        " " + d.target.x + "," + d.target.y;
}

var global_edges, global_nodes


function startStateMachine(){
    // Fetch Nodes
    $(document).ready(function() {
        $.ajax({
            type: "GET",
            url: "static/csv/sample_data_node.csv",
            dataType: "text",
            success: function(data) {
                global_nodes = csvJSON(data)
                 // Fetch Edges
                    $(document).ready(function() {
                        $.ajax({
                            type: "GET",
                            url: "static/csv/sample_data_edge.csv",
                            dataType: "text",
                            success: function(data) {
                                global_edges = csvJSON(data)
                                displayStateMachine(global_nodes, global_edges)
                            }
                        });
                    });
            }
         });
    });
   
    

}
function csvJSON(csv){

    var lines=csv.split("\n");
  
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
  
    for(var i=1;i<lines.length;i++){
  
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
  
        result.push(obj);
  
    }
  
    //return result; //JavaScript object
    return result; //JSON
  }

startStateMachine();


function downloadSample(){
    a = document.createElement('a');
    document.body.appendChild(a);
    a.download = 'node.csv';
    a.href = "static/csv/sample_data_node.csv";
    a.click();
    a.remove();


    a = document.createElement('a');
    document.body.appendChild(a);
    a.download = 'edges.csv';
    a.href = "static/csv/sample_data_edge.csv";
    a.click();
    a.remove();
}

$("#uploadnode").on('change',function(){
    const input = this.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        global_nodes = csvJSON(text)
        global_edges = [];
        displayStateMachine(global_nodes, global_edges)
        $('#uploadedgebtn').attr("disabled", false);
        $('#uploadnode').val("");
    };
    reader.readAsText(input);

});

$("#uploadedge").on('change',function(){
    const input = this.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        global_edges = csvJSON(text)
        $('#uploadedgebtn').attr("disabled", true);
        $('#uploadedge').val("");
        displayStateMachine(global_nodes, global_edges)
    };
    reader.readAsText(input);
});


function range(start, end) {
    var foo = [];
    for (var i = start; i <= end; i++) {
        foo.push(i);
    }
    return foo;
}