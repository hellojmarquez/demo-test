import React from "react";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import Trends from "@/components/Trends";

const Page = async () => {
  const token = getToken();
  const me = await UserServices.getMe(token);
  const allowedArtists = await UserServices.getAllowedArtists(token);
  const myProducts = await UserServices.getMyProducts(token);

  console.log(allowedArtists);
  console.log(myProducts);

  console.log(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]);

  // const trends = await UserServices.getTrends(
  //   "dsp",
  //   "stream",
  //   new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
  //   new Date().toISOString().split("T")[0],
  //   {},
  //   token
  // );

  // console.log(trends);

  return (
    <>  
      <Trends allowedArtists={allowedArtists} myProducts={myProducts}/>
    </>
  );
};

export default Page;
