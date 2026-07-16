import { ReactNode } from "react";

export default function Container({
    children
}:{
    children:ReactNode
}){

    return(

        <div
            style={{
                maxWidth:1200,
                margin:"auto",
                padding:"24px"
            }}
        >
            {children}
        </div>

    )

}