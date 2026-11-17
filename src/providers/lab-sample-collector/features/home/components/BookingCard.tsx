import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { CollectorBooking, CollectorStatus } from "../../provider-data/data";
const BLUE = "#1473E6", TEXT = "#172033", MUTED = "#758096", GREEN = "#159447", ORANGE = "#D98200";
function LocalStatusPill({ status }: { status: CollectorStatus }) {
 const map: Record<CollectorStatus, { bg: string; color: string; label: string }> = {
  NEW:{bg:"#EAF3FF",color:BLUE,label:"NEW REQUEST"}, ACCEPTED:{bg:"#EAF3FF",color:BLUE,label:"ACCEPTED"}, REACHED:{bg:"#FFF2DC",color:ORANGE,label:"REACHED"}, COLLECTING:{bg:"#EAF3FF",color:BLUE,label:"COLLECTING"}, COLLECTED:{bg:"#E6F8EE",color:GREEN,label:"SAMPLE COLLECTED"}, DELIVERING:{bg:"#EAF3FF",color:BLUE,label:"DELIVERING"}, DELIVERED:{bg:"#E6F8EE",color:GREEN,label:"DELIVERED"}, COMPLETED:{bg:"#E6F8EE",color:GREEN,label:"COMPLETED"}
 };
 const item=map[status]; return <View style={{backgroundColor:item.bg,paddingHorizontal:9,paddingVertical:5,borderRadius:8}}><Text style={{color:item.color,fontSize:9,fontWeight:"900"}}>{item.label}</Text></View>;
}
export default function BookingCard({ booking, onPress }: { booking: CollectorBooking; onPress?: () => void }) {
 return <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor:"#fff",borderRadius:16,padding:14,marginBottom:11,borderWidth:1,borderColor:"#E7ECF3",opacity:pressed?0.9:1,elevation:1 })}>
  <View style={{flexDirection:"row",alignItems:"center"}}><View style={{width:46,height:46,borderRadius:14,backgroundColor:"#EAF3FF",alignItems:"center",justifyContent:"center"}}><Ionicons name="flask-outline" size={23} color={BLUE}/></View><View style={{flex:1,marginLeft:11}}><Text style={{color:TEXT,fontSize:14,fontWeight:"900"}}>{booking.patient}</Text><Text style={{color:MUTED,fontSize:10.5,marginTop:4}} numberOfLines={1}>{booking.tests.map(test=>test.name).join(" • ")}</Text></View><LocalStatusPill status={booking.status}/></View>
  <View style={{height:1,backgroundColor:"#EEF1F5",marginVertical:12}}/><View style={{flexDirection:"row",alignItems:"center"}}><Ionicons name="time-outline" size={15} color={BLUE}/><Text style={{marginLeft:6,color:"#424B5C",fontSize:10.5,flex:1}}>{booking.date} • {booking.time}</Text><Text style={{color:TEXT,fontSize:13,fontWeight:"900"}}>₹{booking.amount}</Text></View>
  <View style={{flexDirection:"row",alignItems:"center",marginTop:9}}><Ionicons name="location-outline" size={14} color={MUTED}/><Text style={{marginLeft:5,color:MUTED,fontSize:10.5}} numberOfLines={1}>{booking.address}</Text></View>
 </Pressable>;
}
