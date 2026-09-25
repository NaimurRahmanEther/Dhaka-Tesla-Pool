const buildGraph = (edges)=>{


    const graph={};




    for(const edge of edges){



        const from =
        Number(edge.from_location_id);



        const to =
        Number(edge.to_location_id);



        const distance =
        Number(edge.distance_km);







        if(!graph[from]){

            graph[from]=[];

        }



        if(!graph[to]){

            graph[to]=[];

        }







        // Forward

        graph[from].push({

            node:to,

            distance

        });







        // Reverse

        graph[to].push({

            node:from,

            distance

        });



    }





    return graph;


};





module.exports={
    buildGraph
};