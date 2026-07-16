import SearchBar from "@/components/search/SearchBar";
import HomeHero from "@/components/home/HomeHero";

export default function Home() {
  return (
    <main>

      <HomeHero />

      <div
        style={{
          maxWidth:1200,
          margin:"auto",
          padding:"24px"
        }}
      >
        <SearchBar />

        <h2
          style={{
            marginTop:40,
            marginBottom:16,
            fontSize:24
          }}
        >
          Lângă tine
        </h2>

        <p style={{color:"#94a3b8"}}>
          În sprintul următor aici vor apărea baltile ordonate după distanță.
        </p>

      </div>

    </main>
  );
}