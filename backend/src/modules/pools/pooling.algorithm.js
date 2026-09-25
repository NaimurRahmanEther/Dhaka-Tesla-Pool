const MAX_DETOUR_DISTANCE = 5;




// Calculate extra distance

const calculateDetour = (
    oldDistance,
    newDistance
)=>{

    return Math.max(
        0,
        newDistance - oldDistance
    );

};






// Check detour limit

const isDetourAcceptable = (
    oldDistance,
    newDistance
)=>{


    const detour =
    calculateDetour(
        oldDistance,
        newDistance
    );


    return detour <= MAX_DETOUR_DISTANCE;


};









// Check whether pickup and destination
// are after current Tesla position

const isFutureStop = (

    currentRoute,

    currentIndex,

    pickupLocation,

    destinationLocation

)=>{


    const pickupIndex =
    currentRoute.indexOf(
        pickupLocation
    );


    const destinationIndex =
    currentRoute.indexOf(
        destinationLocation
    );




    if(
        pickupIndex === -1 ||
        destinationIndex === -1
    ){

        return false;

    }






    /*
        Passenger pickup must be
        ahead of Tesla

        Example:

        Current:
        C(index 2)

        Pickup:
        B(index 1)

        Reject

    */


    if(
        pickupIndex < currentIndex
    ){

        return false;

    }







    /*
        Destination must be after pickup

    */


    if(
        destinationIndex <= pickupIndex
    ){

        return false;

    }



    return true;


};












// Generate possible insertion routes

const generatePossibleRoutes = (

    currentRoute,

    currentIndex,

    pickupLocation,

    destinationLocation

)=>{


    const possibleRoutes=[];



    /*
        Only consider future part

        Example:

        Route:

        A B C D E

        Current:

        C


        We only use:

        C D E

    */


    const activeRoute =
    currentRoute.slice(
        currentIndex
    );







    for(
        let pickupIndex=0;

        pickupIndex<=activeRoute.length;

        pickupIndex++

    ){



        const routeWithPickup=[


            ...currentRoute.slice(
                0,
                currentIndex
            ),



            ...activeRoute.slice(
                0,
                pickupIndex
            ),



            pickupLocation,



            ...activeRoute.slice(
                pickupIndex
            )

        ];







        for(
            let destinationIndex=
            pickupIndex+1;


            destinationIndex<=
            activeRoute.length+1;


            destinationIndex++

        ){



            const routeWithDestination=[


                ...routeWithPickup.slice(
                    0,
                    currentIndex +
                    destinationIndex
                ),



                destinationLocation,



                ...routeWithPickup.slice(
                    currentIndex +
                    destinationIndex
                )


            ];






            possibleRoutes.push(
                routeWithDestination
            );

        }

    }





    return possibleRoutes;


};











// Select shortest route

const findBestRoute = (
    routes
)=>{


    if(
        !routes.length
    ){

        return null;

    }




    return routes.reduce(

        (best,current)=>{


            if(
                current.distance <
                best.distance
            ){

                return current;

            }


            return best;


        }

    );


};









module.exports={


    calculateDetour,


    isDetourAcceptable,


    isFutureStop,


    generatePossibleRoutes,


    findBestRoute


};