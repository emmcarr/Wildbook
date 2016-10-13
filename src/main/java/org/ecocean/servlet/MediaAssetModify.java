package org.ecocean.servlet;

import org.ecocean.*;
import org.ecocean.media.*;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;
import java.util.concurrent.ThreadPoolExecutor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.joda.time.DateTime;

import org.json.JSONObject;
import org.json.JSONException;




public class MediaAssetModify extends HttpServlet {
  /** SLF4J logger instance for writing log entries. */
  public static Logger log = LoggerFactory.getLogger(WorkspaceDelete.class);

  public void init(ServletConfig config) throws ServletException {
    super.init(config);
  }

  public void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Allow-Methods", "GET, POST");
      if (request.getHeader("Access-Control-Request-Headers") != null) response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"));
      //response.setContentType("text/plain");
  }



  public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    doPost(request, response);
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    response.setHeader("Access-Control-Allow-Origin", "*");  //allow us stuff from localhost

    String context="context0";
    context=ServletUtilities.getContext(request);
    String langCode = ServletUtilities.getLanguageCode(request);
    Shepherd myShepherd = new Shepherd(context);
    //set up for response
    response.setContentType("text/html");
    PrintWriter out = response.getWriter();
    boolean locked = false;

    JSONObject res = new JSONObject("{\"success\": \"false\"}");

    boolean isOwner = true;


    // ServletUtilities.informInterestedParties(request, request.getParameter("number"), message,context);
    myShepherd.beginDBTransaction();

    String id="";

    try {

      id = request.getParameter("id");
      if (id==null) {
        throw new IOException("MediaAssetModify servlet requires an 'id' argument.");
      }


      MediaAsset ma = myShepherd.getMediaAsset(id);

      if (ma==null) {
        throw new IOException("No MediaAsset in database with id "+request.getParameter("id"));
      } else {

        if ((request.getParameter("annotationId") != null) && (request.getParameter("fx") != null)) {
            FeatureType.initAll(myShepherd);
            res = updateFeature(myShepherd, ma, request);
            locked = !res.optBoolean("success", false);
        }

        if (request.getParameter("lat")!=null) {
          ma.setUserLatitude(Double.valueOf(request.getParameter("lat")));
          res.put("setLatitude",Double.valueOf(request.getParameter("lat")));
            res.put("success","true");
        }

        if (request.getParameter("long")!=null) {
          ma.setUserLongitude(Double.valueOf(request.getParameter("long")));
          res.put("setLongitude",Double.valueOf(request.getParameter("long")));
            res.put("success","true");
        }

        if (request.getParameter("datetime")!=null) {
          ma.setUserDateTime(DateTime.parse(request.getParameter("datetime")));
          res.put("setDateTime",DateTime.parse(request.getParameter("datetime")).toString());
            res.put("success","true");
        }

      }

    } catch (Exception edel) {
      locked = true;
      log.warn("Failed to modify MediaAsset: " + request.getParameter("id"), edel);
      edel.printStackTrace();
      myShepherd.rollbackDBTransaction();
    }


    if (!locked) {
      myShepherd.commitDBTransaction();
    }

    out.println(res.toString());
    out.close();
    myShepherd.closeDBTransaction();
  }

    private JSONObject updateFeature(Shepherd myShepherd, MediaAsset ma, HttpServletRequest request) {
        JSONObject res = new JSONObject("{\"success\": \"false\"}");
        Annotation ann = null;
        try {
            ann = (Annotation) (myShepherd.getPM().getObjectById(myShepherd.getPM().newObjectIdInstance(Annotation.class, request.getParameter("annotationId")), true));
        } catch (Exception ex) {
            res.put("error", "could not load Annotation for " + request.getParameter("annotationId"));
            res.put("exception", ex.toString());
            return res;
        }

        JSONObject params = new JSONObject();
        params.put("_MediaAssetModify", System.currentTimeMillis());
        try {
            params.put("x", Integer.parseInt(request.getParameter("fx")));
            params.put("y", Integer.parseInt(request.getParameter("fy")));
            params.put("width", Integer.parseInt(request.getParameter("fwidth")));
            params.put("height", Integer.parseInt(request.getParameter("fheight")));
        } catch (NumberFormatException nfe) {
            res.put("error", "could not parse parameters");
            res.put("exception", nfe.toString());
            return res;
        }

        //TODO philosophical dilemma: do we replace *any* Feature that already connects this Annotation to MediaAsset ??  not sure!
        //  what if the annot rectangle has moved (we probably dont want both)...  going to [for now] decide to replace: (a) Unity or (b) boundingBox
        Feature ft = null;
        if (ann.getFeatures() != null) {
            for (Feature af : ann.getFeatures()) {
                if (af.isUnity() || af.isType("org.ecocean.boundingBox")) {  //only grab first one. oh well sorry-not-sorry
                    ft = af;
                    break;
                }
            }
        }

        if (ft == null) {
            ft = new Feature("org.ecocean.boundingBox", params);
            ma.addFeature(ft);
            ann.addFeature(ft);
        } else {
            ft.setType(FeatureType.load("org.ecocean.boundingBox"));
            ft.setParameters(params);
            ft.setRevision();
        }
        myShepherd.getPM().makePersistent(ft);
        myShepherd.getPM().makePersistent(ann);
        myShepherd.getPM().makePersistent(ma);

        JSONObject jft = new JSONObject();
        jft.put("id", ft.getId());
        jft.put("type", ft.getType().getId());
        jft.put("parameters", params);
        res.put("feature", jft);
        res.put("success", true);
        return res;
    }

}

