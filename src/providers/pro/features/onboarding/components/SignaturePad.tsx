import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors, radius, spacing, typography } from "../../../theme";
import { Button } from "../../../ui/components";

// Doctor e-signature: drawn with a finger on a canvas (inside a WebView, so no
// extra native module) and kept as a small PNG data URL. The hospital service
// stores it in the doctor's `eSignDocumentUrl`.

const PAD_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#fff;overflow:hidden;touch-action:none}canvas{display:block;width:100%;height:100%}
#hint{position:absolute;left:0;right:0;top:45%;text-align:center;color:#9CA3AF;font:15px sans-serif;pointer-events:none}
#line{position:absolute;left:8%;right:8%;bottom:28%;border-bottom:1.5px dashed #CBD5E1;pointer-events:none}</style></head>
<body><div id="hint">Sign here</div><div id="line"></div><canvas id="c"></canvas><script>
var c=document.getElementById('c'),x=c.getContext('2d'),hint=document.getElementById('hint'),drawing=false,inked=false,last=null;
function size(){var r=window.devicePixelRatio||1;c.width=c.clientWidth*r;c.height=c.clientHeight*r;x.setTransform(r,0,0,r,0,0);x.lineWidth=2.6;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#0F1B33';}
size();
function pt(e){var t=e.touches?e.touches[0]:e;var b=c.getBoundingClientRect();return{x:t.clientX-b.left,y:t.clientY-b.top};}
function start(e){e.preventDefault();drawing=true;last=pt(e);x.beginPath();x.arc(last.x,last.y,1.2,0,7);x.fill();inked=true;hint.style.display='none';}
function move(e){if(!drawing)return;e.preventDefault();var p=pt(e);x.beginPath();x.moveTo(last.x,last.y);x.lineTo(p.x,p.y);x.stroke();last=p;}
function end(){drawing=false;}
c.addEventListener('touchstart',start,{passive:false});c.addEventListener('touchmove',move,{passive:false});c.addEventListener('touchend',end);
c.addEventListener('mousedown',start);c.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
window.clearPad=function(){x.clearRect(0,0,c.width,c.height);inked=false;hint.style.display='block';};
window.savePad=function(){if(!inked){window.ReactNativeWebView.postMessage('EMPTY');return;}
var o=document.createElement('canvas');o.width=480;o.height=Math.round(480*c.height/c.width);var ox=o.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,o.width,o.height);ox.drawImage(c,0,0,o.width,o.height);
window.ReactNativeWebView.postMessage(o.toDataURL('image/png'));};
</script></body></html>`;

export default function SignaturePad({ value, onChange, required }: { value?: string; onChange: (dataUrl: string) => void; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const [empty, setEmpty] = useState(false);
  const web = useRef<WebView>(null);
  const signed = typeof value === "string" && value.startsWith("data:image");

  return (
    <View>
      {signed ? (
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.white }}>
          <Image source={{ uri: value }} style={{ width: "100%", height: 120 }} resizeMode="contain" />
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Pressable onPress={() => setOpen(true)} style={{ flex: 1, padding: spacing.md, alignItems: "center" }}>
              <Text style={{ color: colors.brand, fontWeight: "700" }}>Sign again</Text>
            </Pressable>
            <Pressable onPress={() => onChange("")} style={{ flex: 1, padding: spacing.md, alignItems: "center", borderLeftWidth: 1, borderLeftColor: colors.divider }}>
              <Text style={{ color: colors.red, fontWeight: "700" }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({ height: 96, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: required ? colors.amber : colors.brand, backgroundColor: pressed ? colors.brandSoft : colors.surface, alignItems: "center", justifyContent: "center", gap: 6 })}
        >
          <Ionicons name="create-outline" size={24} color={colors.brand} />
          <Text style={{ color: colors.brand, fontWeight: "700" }}>Tap for the doctor to sign</Text>
        </Pressable>
      )}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl * 2 }}>
          <Text style={typography.title}>Doctor e-signature</Text>
          <Text style={[typography.caption, { marginTop: 4 }]}>Ask the doctor to sign with a finger inside the box.</Text>
          <View style={{ height: 260, marginTop: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: empty ? colors.red : colors.border, overflow: "hidden", backgroundColor: colors.white }}>
            <WebView
              ref={web}
              source={{ html: PAD_HTML }}
              originWhitelist={["*"]}
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              onMessage={(event) => {
                const data = event.nativeEvent.data;
                if (data === "EMPTY") { setEmpty(true); return; }
                setEmpty(false);
                onChange(data);
                setOpen(false);
              }}
            />
          </View>
          {empty ? <Text style={{ color: colors.red, marginTop: spacing.sm, fontWeight: "600" }}>The box is empty - sign first.</Text> : null}
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Clear" icon="refresh" variant="ghost" onPress={() => { setEmpty(false); web.current?.injectJavaScript("window.clearPad();true;"); }} style={{ flex: 1 }} />
            <Button label="Save signature" icon="checkmark" onPress={() => web.current?.injectJavaScript("window.savePad();true;")} style={{ flex: 1 }} />
          </View>
          <Button label="Cancel" variant="ghost" onPress={() => { setEmpty(false); setOpen(false); }} style={{ marginTop: spacing.sm }} />
        </View>
      </Modal>
    </View>
  );
}
