package io.wanban.assistant;
import org.json.*;import java.net.*;import java.io.*;import java.nio.charset.StandardCharsets;import com.sun.net.httpserver.*;
public class SearchClientTest {
 static int count;static void ok(boolean b,String n){if(!b)throw new AssertionError(n);count++;System.out.println("PASS "+n);}
 interface Work{void run()throws Exception;}static void fail(Work w,String n)throws Exception{try{w.run();throw new AssertionError(n);}catch(AssertionError e){throw e;}catch(Exception expected){count++;System.out.println("PASS "+n);}}
 public static void main(String[] args)throws Exception{
  ok(SearchClient.endpoint("glm").endsWith("/web_search"),"official independent search endpoint");
  JSONObject body=SearchClient.request("glm","周末电影");ok(body.getString("search_engine").equals("search_std")&&body.getInt("count")==8,"bounded search request");
  fail(()->SearchClient.request("glm"," "),"empty search query rejected");fail(()->SearchClient.request("glm",new String(new char[129]).replace('\0','好')),"oversized search rejected");fail(()->SearchClient.endpoint("custom"),"custom search provider rejected");
  JSONArray items=new JSONArray().put(new JSONObject().put("title","示例").put("link","https://example.com/1").put("content","摘要").put("media","来源"));
  items.put(items.getJSONObject(0)).put(new JSONObject().put("link","javascript:alert(1)")).put(new JSONObject().put("link","https://user:pass@example.com"));
  JSONArray normalized=SearchClient.normalize("glm",new JSONObject().put("search_result",items));ok(normalized.length()==1,"deduplicate and reject unsafe sources");ok(normalized.getJSONObject(0).getString("snippet").equals("摘要"),"search content normalized");
  fail(()->SearchClient.normalize("glm",new JSONObject()),"unknown search shape rejected");
  JSONArray many=new JSONArray();for(int i=0;i<20;i++)many.put(new JSONObject().put("link","https://example.com/"+i).put("content",new String(new char[7000]).replace('\0','x')));
  normalized=SearchClient.normalize("glm",new JSONObject().put("search_result",many));ok(normalized.length()==8&&normalized.getJSONObject(0).getString("snippet").length()==6000,"source and snippet size bounded");
  final ModelHttpClient.Control ctrl=new ModelHttpClient.Control();ModelConfig proxy=new ModelConfig("glm","https://proxy.example/v1/chat/completions","glm-5.3","secret",8192,false);
  fail(()->new SearchClient().execute(proxy,"test",ctrl),"proxy key never reused for official search");
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);final String[] raw={""};
  server.createContext("/ok",x->{raw[0]=new String(x.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);byte[] bytes="{\"search_result\":[{\"title\":\"本机模拟\",\"link\":\"https://example.com/film\",\"content\":\"公开摘要\"}]}".getBytes(StandardCharsets.UTF_8);x.sendResponseHeaders(200,bytes.length);try(OutputStream o=x.getResponseBody()){o.write(bytes);}});
  server.start();try{final int port=server.getAddress().getPort();SearchClient c=new SearchClient(){@Override HttpURLConnection open(URL u)throws IOException{return (HttpURLConnection)new URL("http://127.0.0.1:"+port+"/ok").openConnection();}};ModelConfig official=ModelConfig.defaults("glm");ModelConfig withKey=new ModelConfig("glm",official.endpoint,official.model,"mock-key-only",8192,false);normalized=c.execute(withKey,"电影",ctrl);ok(normalized.length()==1&&new JSONObject(raw[0]).getString("search_query").equals("电影"),"mock HTTP search roundtrip");ok(ctrl.connection==null,"search disconnects after completion");}finally{server.stop(0);}
  System.out.println("TOTAL SEARCH PASSED: "+count);
 }
}
