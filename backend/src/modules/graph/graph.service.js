const graphRepository =
require("./graph.repository");


const {
    buildGraph
}
=
require("./graph.utils");




const getRoadGraph = async()=>{


    const edges =
    await graphRepository.getRoadEdges();



    const graph =
    buildGraph(edges);



    return graph;

};



module.exports={

    getRoadGraph

};