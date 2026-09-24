const buildGraph = (edges)=>{


    const graph = {};



    for(const edge of edges){


        const from =
        edge.from_location_id;


        const to =
        edge.to_location_id;


        const distance =
        edge.distance;



        if(!graph[from]){

            graph[from]=[];

        }



        if(!graph[to]){

            graph[to]=[];

        }



        // forward direction

        graph[from].push({

            node:to,

            distance

        });



        // reverse direction

        graph[to].push({

            node:from,

            distance

        });


    }



    return graph;

};



module.exports = {

    buildGraph

};