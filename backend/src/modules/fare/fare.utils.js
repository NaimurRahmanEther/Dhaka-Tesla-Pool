const BASE_FARE = 50;

const PRICE_PER_KM = 20;



const calculateFare = (distance) => {


    if(distance < 0){

        throw new Error(
            "Distance cannot be negative"
        );

    }



    const fare =
    BASE_FARE +
    (distance * PRICE_PER_KM);



    return Math.round(fare);

};





module.exports = {

    calculateFare

};