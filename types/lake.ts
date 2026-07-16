export interface Lake{

    id:string;

    name:string;

    latitude:number;

    longitude:number;

    county?:string;

    locality?:string;

    retention?:boolean;

}