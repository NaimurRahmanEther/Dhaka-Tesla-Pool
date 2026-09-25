const graphService =
require("../graph/graph.service");




// Calculate total route distance

const calculateRouteDistance = async(route)=>{


    let distance = 0;


    for(
        let i = 0;
        i < route.length - 1;
        i++
    ){

        const from =
        route[i];


        const to =
        route[i+1];


        const result =
        await graphService.shortestPath(
            from,
            to
        );


        distance += result.distance;

    }


    return distance;

};





// Generate possible insertion routes

const generateInsertionRoutes = (

    currentRoute,

    pickup,

    destination

)=>{


    const routes = [];



    for(
        let i = 0;
        i < currentRoute.length;
        i++
    ){


        for(
            let j=i+1;
            j<=currentRoute.length;
            j++
        ){


            const newRoute =
            [

                ...currentRoute.slice(
                    0,
                    i
                ),


                pickup,


                destination,


                ...currentRoute.slice(
                    i
                )

            ];



            routes.push(newRoute);


        }

    }



    return routes;

};





// Find best route after adding passenger

const findBestRoute = async({

    currentRoute,

    pickup,

    destination

})=>{


    const possibleRoutes =
    generateInsertionRoutes(

        currentRoute,

        pickup,

        destination

    );



    let bestRoute = null;

    let minimumDistance =
    Infinity;



    for(
        const route of possibleRoutes
    ){


        const distance =
        await calculateRouteDistance(
            route
        );



        if(
            distance <
            minimumDistance
        ){


            minimumDistance =
            distance;


            bestRoute =
            route;

        }

    }



    return {

        route:bestRoute,

        distance:minimumDistance

    };

};




module.exports={

    calculateRouteDistance,

    generateInsertionRoutes,

    findBestRoute

};