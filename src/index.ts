import { HmacSHA1, enc } from 'crypto-js';
import OAuth from 'oauth-1.0a';

async function Tweet(env: Env) {
    const oauth = new OAuth({
        consumer: { key: env.TWITTER_API_KEY, secret: env.TWITTER_API_SECRET },
        signature_method: 'HMAC-SHA1',
        hash_function: hashSha1,
    });

    function hashSha1(baseString: any, key: any) {
        return HmacSHA1(baseString, key).toString(enc.Base64)
    }
    // Gera um pensamento com IA (exemplo usando OpenAI, pode trocar por outro provedor)
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.OPENROUTER_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3.1:free",
            messages: [
                { role: "system", content: "Você é um filósofo chamado 'Pensamentos Intrusivos'. Crie reflexões filosóficas profundas e originais sobre a vida, existência, mente humana, sociedade, tempo, conhecimento, felicidade e tristeza. Evite repetir temas já mencionados e nunca foque apenas em espelhos ou reflexões literais. Cada frase deve ser independente, curta ou média, impactante, poética e instigante." },
                { role: "user", content: "Crie uma frase filosófica original, capaz de fazer o leitor pensar profundamente sobre a realidade e a existência." }
            ],
            max_tokens: 50,
        }),
    });
    if (!aiResponse.ok) throw new Error("AI ERROR: " + aiResponse.statusText)

    const data = await aiResponse.json() as any;
    const thought = data?.choices?.[0]?.message?.content?.trim() ?? "A vida continua...";
    const reqAuth = {
        url: "https://api.x.com/2/tweets",
        method: 'POST',
    };

    const token = {
        key: env.TWITTER_ACCESS_TOKEN,
        secret: env.TWITTER_ACCESS_SECRET,
    };
    // Posta no X (Twitter)
    const tweetResponse = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
            ...oauth.toHeader(oauth.authorize(reqAuth, token)), // ou OAuth2 se precisar
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: thought }),
    });

    if (!tweetResponse.ok) {
        const err = await tweetResponse.text();
        console.error("Erro ao postar no X:", err);
        return new Response('Erro ao postar no X: ' + err)
    } else {
        console.log("Tweet postado:", thought);
        return new Response('Tweet postado: ' + thought);
    }
    // return new Response("Done.");
}
export default {
    async scheduled(control, env, ctx) {
        try {
            await Tweet(env); // garante que só posta uma vez
        } catch (err) {
            console.error(err);
        }
    },
    async fetch(req, env, ctx) {
        if(req.method !== "GET") return new Response('Need to be GET');
        try {
            return await Tweet(env);
        } catch (err) {
            console.error(err);
            return new Response('Erro ao postar', { status: 500 });
        }
    }
} satisfies ExportedHandler<Env>;
