import { marked } from 'marked';

let updateJson:any;
let homePage:string;

async function getUpdata() {
		const updateData = await fetch("https://api.github.com/repos/ShadowMario/FNF-PsychEngine/releases/latest");
		updateJson = await updateData.json();
}

async function createPages() {
	const homeHtml = Bun.file("./bin/homePage/home.html");
	let homeText = await homeHtml.text();
	const globalCss = Bun.file("./bin/global.css");
	const globalCssText = await globalCss.text();
	const changeLog = await fetch("https://raw.githubusercontent.com/ShadowMario/FNF-PsychEngine/main/README.md")
	const changeLogContent = await changeLog.text();
	
	homeText = homeText.replace("?changeLog", marked.parse(changeLogContent).toString());
	homeText = homeText.replace("?css", "<style>" + globalCssText + "</style>");
	
	homePage = homeText;
}

getUpdata();
createPages();

Bun.serve({
	async fetch(req) {
		const path = new URL(req.url).pathname;
		const params = new URL(req.url).searchParams;

		// respond with text/html
		if (path === "/") return new Response(homePage, {
				headers: {
					"Content-Type": "text/html",
				},
			});

		// respond with JSON
		if (path === "/api") {
			switch (params.get("use")) {
				case "update":
					let needsUpdate = false;
					let version = params.get("version")
					if (version == null) version = "0";
					if (!(version >= updateJson.name)) needsUpdate = true;
					if (needsUpdate) {
						let platform: number
						if (!params.get("platform") == null) {
							platform = parseInt(params.get("platform") ?? "0");
						} else {
							platform = 0;
						}
						return Response.json({ needsUpdate: true, url: updateJson.assets[platform].browser_download_url });
					} else {
						return Response.json({ needsUpdate: false });
					}
				default:
					return new Response("No Parameters Given")
			}
		}

		// 404s
		return new Response(Bun.file("./bin/error.html"), { status: 404 });
	}
})