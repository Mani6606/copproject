export default async function Country({params}:any){
    const cou =await params;
    return<h1 className="flex items-center justify-center h-screen text-3xl font-bold">
    Country: {cou?.country}
  </h1>
}