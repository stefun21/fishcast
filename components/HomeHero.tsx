export default function HomeHero(){

    return(

        <section
            style={{
                padding:"80px 24px",
                background:
                "linear-gradient(180deg,#10253f,#07111d)"
            }}
        >

            <div
                style={{
                    maxWidth:1200,
                    margin:"auto"
                }}
            >

                <h1
                    style={{
                        fontSize:56,
                        fontWeight:800
                    }}
                >
                    FishCast România
                </h1>

                <p
                    style={{
                        marginTop:20,
                        color:"#94a3b8",
                        maxWidth:650,
                        fontSize:20,
                        lineHeight:1.6
                    }}
                >
                    Descoperă cele mai bune locuri de pescuit din România,
                    vezi condițiile meteo și află unde merită să mergi chiar astăzi.
                </p>

            </div>

        </section>

    )

}