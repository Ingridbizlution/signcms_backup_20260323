import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string || file?.name || "unknown";
    const type = formData.get("type") as string || "image";
    const dimensions = formData.get("dimensions") as string || "-";
    const duration = formData.get("duration") as string | null;
    const projectId = formData.get("design_project_id") as string | null;
    const orgId = formData.get("org_id") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Manual base64 encoding for Deno
    const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let base64 = "";
    const bytes = uint8Array;
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
      const b0 = bytes[i];
      const b1 = i + 1 < len ? bytes[i + 1] : 0;
      const b2 = i + 2 < len ? bytes[i + 2] : 0;
      base64 += base64Chars[b0 >> 2];
      base64 += base64Chars[((b0 & 3) << 4) | (b1 >> 4)];
      base64 += i + 1 < len ? base64Chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
      base64 += i + 2 < len ? base64Chars[b2 & 63] : "=";
    }

    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Format file size
    const sizeBytes = file.size;
    let sizeStr: string;
    if (sizeBytes < 1024) sizeStr = `${sizeBytes} B`;
    else if (sizeBytes < 1024 * 1024) sizeStr = `${(sizeBytes / 1024).toFixed(1)} KB`;
    else sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

    // Generate thumbnail for images (use same data URL, smaller for videos)
    const thumbnail = type === "image" ? dataUrl : "";

    // Insert into database using service role (bypasses REST payload limits)
    const insertData: Record<string, unknown> = {
      name,
      type,
      url: dataUrl,
      thumbnail,
      size: sizeStr,
      dimensions,
      duration: duration || null,
      uploaded_by: user.id,
      design_project_id: projectId && projectId !== "__none__" ? projectId : null,
      org_id: orgId && orgId !== "" ? orgId : null,
    };

    const { data, error } = await supabase.from("media_items").insert(insertData).select("id").single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
