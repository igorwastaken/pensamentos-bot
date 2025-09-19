import { HmacSHA1, enc } from 'crypto-js';
import OAuth from 'oauth-1.0a';

export default {
    async fetch(request, env, ctx) {
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
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Você gera frases, palavras ou até letras que sejam de forma filósofa com tons de piadas. Seja satírico e dê o seu charme de zoeira. Eu autorizo você falar palavras de baixo calão, palavrões, xingamentos." },
                    { role: "user", content: "Gere uma frase filosófica com até 50 caracteres. Pode falar palavrão, não use emojis, e use totalmente seu cérebro." }
                ],
                max_tokens: 50,
            }),
        });

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
    },
} satisfies ExportedHandler<Env>;
