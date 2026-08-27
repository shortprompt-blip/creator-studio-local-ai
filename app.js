(function () {

    'use strict';

    /*
     * ShortPrompt Creator Studio
     *
     * V1 architecture:
     *
     * INSTANT MODE
     * - No AI model
     * - No WebGPU
     * - No API
     * - No download
     * - Works immediately
     *
     * LOCAL AI MODE
     * - Optional
     * - WebLLM
     * - User explicitly chooses it
     */

    const MODEL =
        'Llama-3.2-3B-Instruct-q4f16_1-MLC';

    let engine = null;
    let loading = false;
    let currentMode = 'instant';


    /* --------------------------------------------------
       HELPERS
    -------------------------------------------------- */

    function $(id) {
        return document.getElementById(id);
    }


    function showError(message) {

        const error = $('spcs-error');

        if (!error) return;

        error.textContent = message;
        error.style.display = 'block';

    }


    function hideError() {

        const error = $('spcs-error');

        if (!error) return;

        error.textContent = '';
        error.style.display = 'none';

    }


    function setStatus(text) {

        const status = $('spcs-model-status');

        if (status) {
            status.textContent = text;
        }

    }


    function setProgress(percent, text) {

        const wrapper =
            $('spcs-progress-wrapper');

        const bar =
            $('spcs-progress-bar');

        const label =
            $('spcs-progress-text');

        const percentage =
            $('spcs-progress-percent');


        if (wrapper) {
            wrapper.style.display = 'block';
        }


        if (bar) {

            bar.style.width =
                Math.max(
                    0,
                    Math.min(100, percent)
                ) + '%';

        }


        if (label) {
            label.textContent =
                text || 'Loading AI...';
        }


        if (percentage) {

            percentage.textContent =
                Math.round(percent) + '%';

        }

    }


    /* --------------------------------------------------
       INPUT DATA
    -------------------------------------------------- */

    function getFormData() {

        return {

            platform:
                $('spcs-platform').value,

            contentType:
                $('spcs-content-type').value,

            goal:
                $('spcs-goal').value,

            tone:
                $('spcs-tone').value,

            topic:
                $('spcs-topic').value.trim(),

            style:
                $('spcs-style').value.trim()

        };

    }


    /* --------------------------------------------------
       TEXT UTILITIES
    -------------------------------------------------- */

    function cleanText(text) {

        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim();

    }


    function capitalize(text) {

        text =
            cleanText(text);

        if (!text) return '';

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }


    function getFirstSentence(text) {

        text =
            cleanText(text);

        if (!text) return '';

        const match =
            text.match(
                /^(.{1,120}?)([.!?]|$)/
            );

        if (match && match[1]) {
            return capitalize(match[1]);
        }

        return capitalize(
            text.substring(0, 100)
        );

    }


    function removeTrailingPunctuation(text) {

        return String(text || '')
            .replace(/[.!?]+$/, '')
            .trim();

    }


    /* --------------------------------------------------
       HOOK GENERATOR
    -------------------------------------------------- */

    function generateHook(data) {

        const topic =
            removeTrailingPunctuation(
                data.topic
            );


        const hooks = {

            Engagement: [
                `La verità su ${topic}`,
                `Quanti di voi fanno ancora ${topic}?`,
                `Parliamone: ${topic}`,
                `Una cosa che avrei voluto sapere prima su ${topic}`
            ],

            Reach: [
                `Se ti interessa ${topic}, fermati un secondo.`,
                `Questo potrebbe cambiarti il modo di vedere ${topic}.`,
                `Ecco cosa devi sapere su ${topic}.`,
                `Se stai pensando a ${topic}, guarda qui.`
            ],

            Followers: [
                `Se ti interessa ${topic}, seguimi.`,
                `Sto testando qualcosa di interessante su ${topic}.`,
                `Se vuoi scoprire di più su ${topic}, resta qui.`,
                `Parliamo finalmente di ${topic}.`
            ],

            Sales: [
                `Stai cercando una soluzione per ${topic}?`,
                `Ecco perché ${topic} potrebbe fare la differenza.`,
                `Prima di scegliere, guarda questo.`,
                `Se stai valutando ${topic}, questo ti interessa.`
            ],

            Education: [
                `Ecco la cosa più importante da sapere su ${topic}.`,
                `${capitalize(topic)} spiegato in modo semplice.`,
                `3 cose da sapere su ${topic}.`,
                `Partiamo dalle basi: ${topic}.`
            ],

            'Brand awareness': [
                `Dietro ${topic} c'è molto più di quanto sembra.`,
                `Vi racconto la nostra esperienza con ${topic}.`,
                `Per noi ${topic} significa questo.`,
                `Ecco perché parliamo di ${topic}.`
            ]

        };


        const options =
            hooks[data.goal] ||
            hooks.Engagement;


        return options[
            Math.floor(
                Math.random() * options.length
            )
        ];

    }


    /* --------------------------------------------------
       CAPTION GENERATOR
    -------------------------------------------------- */

    function generateCaption(data) {

        const topic =
            capitalize(
                removeTrailingPunctuation(
                    data.topic
                )
            );


        let caption = '';


        switch (data.tone) {

            case 'Professional':

                caption =
                    `${topic}. Un tema che merita attenzione e un approccio concreto. ` +
                    `Ecco alcuni spunti utili da tenere in considerazione.`;

                break;


            case 'Friendly and conversational':

                caption =
                    `Parliamone 😊\n\n` +
                    `${topic}. ` +
                    `Vi racconto cosa penso e perché secondo me vale la pena approfondire questo tema.`;

                break;


            case 'Energetic and viral':

                caption =
                    `Ok, parliamone 🔥\n\n` +
                    `${topic}.\n\n` +
                    `Questa è una di quelle cose che vale la pena vedere fino alla fine.`;

                break;


            case 'Educational':

                caption =
                    `${topic}.\n\n` +
                    `Se vuoi capirlo meglio, ecco il punto di partenza: ` +
                    `concentrati sugli aspetti più importanti e non perderti nei dettagli inutili.`;

                break;


            case 'Minimalist':

                caption =
                    `${topic}.\n\n` +
                    `Semplice. Diretto. Da tenere a mente.`;

                break;


            case 'Funny':

                caption =
                    `${topic} 😂\n\n` +
                    `Perché evidentemente dovevamo parlare anche di questo. ` +
                    `E sì, probabilmente ne vale la pena.`;

                break;


            default:

                caption =
                    `${topic}.\n\n` +
                    `Un argomento interessante, soprattutto se vuoi capire meglio ` +
                    `cosa funziona davvero e cosa invece è solo rumore.`;

        }


        if (data.style) {

            caption +=
                `\n\n${data.style}`;

        }


        return caption;

    }


    /* --------------------------------------------------
       CTA
    -------------------------------------------------- */

    function generateCTA(data) {

        const ctas = {

            Engagement: [
                'Cosa ne pensi? Scrivilo nei commenti.',
                'Sei d’accordo? Dimmi la tua.',
                'Qual è la tua esperienza?'
            ],

            Reach: [
                'Condividilo con qualcuno a cui potrebbe servire.',
                'Salvalo per dopo.',
                'Mandalo a una persona che deve vederlo.'
            ],

            Followers: [
                'Seguimi per altri contenuti come questo.',
                'Seguimi se vuoi vedere altri contenuti su questo tema.',
                'Se ti interessa l’argomento, seguimi.'
            ],

            Sales: [
                'Scopri di più e valuta se fa al caso tuo.',
                'Vuoi saperne di più? Contattami.',
                'Scrivimi per maggiori informazioni.'
            ],

            Education: [
                'Salva questo post per rivederlo più avanti.',
                'Quale punto vuoi approfondire?',
                'Seguimi per altri contenuti utili.'
            ],

            'Brand awareness': [
                'Seguici per scoprire i prossimi contenuti.',
                'Raccontaci cosa ne pensi.',
                'Scopri di più sul nostro progetto.'
            ]

        };


        const options =
            ctas[data.goal] ||
            ctas.Engagement;


        return options[
            Math.floor(
                Math.random() * options.length
            )
        ];

    }


    /* --------------------------------------------------
       HASHTAGS
    -------------------------------------------------- */

    function generateHashtags(data) {

        const words =
            data.topic
                .toLowerCase()
                .replace(
                    /[^\p{L}\p{N}\s]/gu,
                    ''
                )
                .split(/\s+/)
                .filter(function (word) {

                    return (
                        word.length >= 4 &&
                        word.length <= 25
                    );

                });


        const unique =
            [...new Set(words)];


        const tags =
            unique
                .slice(0, 5)
                .map(function (word) {

                    return '#' + word;

                });


        const platformTags = {

            Instagram: [
                '#contentcreator',
                '#socialmedia'
            ],

            TikTok: [
                '#tiktokitalia',
                '#creator'
            ],

            'YouTube Shorts': [
                '#youtubeShorts',
                '#creator'
            ],

            LinkedIn: [
                '#linkedin',
                '#digitalmarketing'
            ],

            X: [
                '#socialmedia',
                '#content'
            ]

        };


        const extra =
            platformTags[data.platform] ||
            [];


        return [
            ...tags,
            ...extra
        ]
        .filter(
            (value, index, array) =>
                array.indexOf(value) === index
        )
        .join(' ');

    }


    /* --------------------------------------------------
       INSTANT GENERATOR
    -------------------------------------------------- */

    function generateInstant(data) {

        return {

            hook:
                generateHook(data),

            caption:
                generateCaption(data),

            cta:
                generateCTA(data),

            hashtags:
                generateHashtags(data)

        };

    }


    /* --------------------------------------------------
       RENDER RESULT
    -------------------------------------------------- */

    function renderResult(result) {

        $('spcs-hook').textContent =
            result.hook || '';

        $('spcs-caption').textContent =
            result.caption || '';

        $('spcs-cta').textContent =
            result.cta || '';

        $('spcs-hashtags').textContent =
            result.hashtags || '';

    }


    /* --------------------------------------------------
       LOCAL AI
    -------------------------------------------------- */

    async function loadWebLLM() {

        if (engine) {

            setStatus(
                'Local AI ready — processing on your device'
            );

            return;

        }


        if (loading) return;

        hideError();


        if (!('gpu' in navigator)) {

            setStatus(
                'WebGPU unavailable'
            );

            showError(
                'Your browser does not support WebGPU. ' +
                'Instant Mode is still available.'
            );

            return;

        }


        loading = true;


        const button =
            $('spcs-load-model');


        if (button) {

            button.disabled = true;

            button.textContent =
                'Loading Local AI...';

        }


        setStatus(
            'Downloading local AI model...'
        );


        setProgress(
            1,
            'Preparing local AI model...'
        );


        try {

            if (!window.spWebLLM) {

                const module =
                    await import(
                        'https://esm.run/@mlc-ai/web-llm'
                    );

                window.spWebLLM =
                    module;

            }


            const webllm =
                window.spWebLLM;


            engine =
                await webllm.CreateMLCEngine(

                    MODEL,

                    {

                        initProgressCallback:
                            function (progress) {

                                let percent = 0;

                                if (
                                    progress &&
                                    typeof progress.progress ===
                                        'number'
                                ) {

                                    percent =
                                        progress.progress *
                                        100;

                                }


                                setProgress(
                                    percent,
                                    progress &&
                                    progress.text
                                        ? progress.text
                                        : 'Loading local AI...'
                                );

                            }

                    }

                );


            setProgress(
                100,
                'Local AI ready'
            );


            setStatus(
                'Local AI ready — processing on your device'
            );


            if (button) {

                button.textContent =
                    '✓ Local AI Ready';

            }


        } catch (error) {

            console.error(
                'ShortPrompt Creator Studio:',
                error
            );


            engine = null;


            setStatus(
                'Local AI unavailable'
            );


            if (button) {

                button.disabled = false;

                button.textContent =
                    'Retry Local AI';

            }


            showError(
                'Local AI could not be loaded. ' +
                'You can continue using Instant Mode without downloading anything.'
            );

        } finally {

            loading = false;

        }

    }


    /* --------------------------------------------------
       LOCAL AI PROMPT
    -------------------------------------------------- */

    function buildPrompt(data) {

        return `
You are a professional social media content strategist.

Create content for a creator.

Platform:
${data.platform}

Content type:
${data.contentType}

Goal:
${data.goal}

Tone:
${data.tone}

Topic:
${data.topic}

Creator style:
${data.style || 'None'}

Return ONLY valid JSON.

{
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": "string"
}

Rules:

- Natural human writing.
- Do not mention AI.
- Do not invent facts.
- Avoid generic corporate language.
- Hook must be attention-grabbing but not misleading.
- Caption must fit the selected platform.
- CTA must be realistic.
- Hashtags must be relevant.
- Keep everything concise.
`;

    }


    function cleanJSON(text) {

        text =
            String(text || '')
                .trim();


        text =
            text
                .replace(
                    /^```json/i,
                    ''
                )
                .replace(
                    /^```/i,
                    ''
                )
                .replace(
                    /```$/i,
                    ''
                )
                .trim();


        const first =
            text.indexOf('{');

        const last =
            text.lastIndexOf('}');


        if (
            first !== -1 &&
            last !== -1 &&
            last > first
        ) {

            text =
                text.substring(
                    first,
                    last + 1
                );

        }


        return text;

    }


    async function generateLocalAI(data) {

        if (!engine) {

            throw new Error(
                'Local AI is not loaded.'
            );

        }


        const response =
            await engine.chat.completions.create({

                messages: [

                    {

                        role: 'system',

                        content:
                            'You are a precise social media copywriter. Return JSON only.'

                    },

                    {

                        role: 'user',

                        content:
                            buildPrompt(data)

                    }

                ],

                temperature: 0.7,

                max_tokens: 900

            });


        const raw =
            response &&
            response.choices &&
            response.choices[0] &&
            response.choices[0].message
                ? response.choices[0].message.content
                : '';


        if (!raw) {

            throw new Error(
                'The model returned an empty response.'
            );

        }


        let result;


        try {

            result =
                JSON.parse(
                    cleanJSON(raw)
                );

        } catch (error) {

            throw new Error(
                'The local AI returned an invalid format. Try again.'
            );

        }


        return result;

    }


    /* --------------------------------------------------
       GENERATE
    -------------------------------------------------- */

    async function generateContent() {

        hideError();


        const data =
            getFormData();


        if (!data.topic) {

            showError(
                'Describe what you want to publish first.'
            );

            $('spcs-topic').focus();

            return;

        }


        const button =
            $('spcs-generate');


        button.disabled = true;


        try {

            let result;


            if (currentMode === 'local') {

                if (!engine) {

                    throw new Error(
                        'Load Local AI first, or switch back to Instant Mode.'
                    );

                }


                button.textContent =
                    '⏳ Generating locally...';


                result =
                    await generateLocalAI(data);

 
        loadButton.disabled = true;

        loadButton.textContent =
            'Loading Local AI...';

        setStatus(
            'Downloading model for first use...'
        );

        setProgress(
            1,
            'Preparing local AI model...'
        );

        try {

            if (!window.spWebLLM) {

                const module = await import(
                    'https://esm.run/@mlc-ai/web-llm'
                );

                window.spWebLLM = module;

            }

            const webllm = window.spWebLLM;

            engine =
                await webllm.CreateMLCEngine(
                    MODEL,
                    {
                        initProgressCallback: function (progress) {

                            let percent = 0;

                            if (
                                progress &&
                                typeof progress.progress === 'number'
                            ) {

                                percent =
                                    progress.progress * 100;

                            }

                            const text =
                                progress &&
                                progress.text
                                    ? progress.text
                                    : 'Loading local AI model...';

                            setProgress(
                                percent,
                                text
                            );

                        }
                    }
                );

            setProgress(
                100,
                'Local AI ready'
            );

            setStatus(
                'Local AI ready — processing on your device'
            );

            loadButton.textContent =
                '✓ AI Ready';

            loadButton.disabled = true;

            $('spcs-generate').disabled = false;

        } catch (error) {

            console.error(
                'ShortPrompt Creator Studio:',
                error
            );

            engine = null;

            setStatus(
                'Model loading failed'
            );

            loadButton.disabled = false;

            loadButton.textContent =
                'Retry Local AI';

            showError(
                'The local AI model could not be loaded. ' +
                'Check that WebGPU is enabled and try again.'
            );

        } finally {

            loading = false;

        }

    }


    function buildPrompt() {

        const platform =
            $('spcs-platform').value;

        const contentType =
            $('spcs-content-type').value;

        const goal =
            $('spcs-goal').value;

        const tone =
            $('spcs-tone').value;

        const topic =
            $('spcs-topic').value.trim();

        const style =
            $('spcs-style').value.trim();


        return `
You are a professional social media content strategist.

Create content for a creator.

PLATFORM:
${platform}

CONTENT TYPE:
${contentType}

GOAL:
${goal}

TONE:
${tone}

CONTENT / TOPIC:
${topic}

CREATOR STYLE:
${style || 'No additional style instructions.'}

Return ONLY valid JSON.

Use exactly this structure:

{
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": "string"
}

Requirements:

- Write naturally.
- Do not mention that you are an AI.
- Do not invent specific facts about the product or creator.
- Avoid generic corporate language.
- The hook must be attention-grabbing but not misleading.
- The caption must be appropriate for ${platform}.
- The CTA must encourage a realistic action.
- Hashtags should be relevant and not excessively generic.
- Use the selected tone.
- Keep the content concise enough for social media.
`;
    }


    function cleanJSON(text) {

        text = text.trim();

        text = text
            .replace(/^```json/i, '')
            .replace(/^```/i, '')
            .replace(/```$/i, '')
            .trim();

        const first =
            text.indexOf('{');

        const last =
            text.lastIndexOf('}');

        if (
            first !== -1 &&
            last !== -1 &&
            last > first
        ) {

            text =
                text.substring(
                    first,
                    last + 1
                );

        }

        return text;

    }


    async function generateContent() {

        hideError();

        if (!engine) {

            showError(
                'Load the Local AI model first.'
            );

            return;

        }

        const topic =
            $('spcs-topic').value.trim();

        if (!topic) {

            showError(
                'Describe the content you want to publish first.'
            );

            $('spcs-topic').focus();

            return;

        }


        const button =
            $('spcs-generate');

        button.disabled = true;

        button.textContent =
            '⏳ Generating locally...';


        try {

            const prompt =
                buildPrompt();


            const response =
                await engine.chat.completions.create({

                    messages: [

                        {
                            role: 'system',

                            content:
                                'You are a precise social media copywriter. Return JSON only.'
                        },

                        {
                            role: 'user',

                            content: prompt
                        }

                    ],

                    temperature: 0.7,

                    max_tokens: 900

                });


            const raw =
                response &&
                response.choices &&
                response.choices[0] &&
                response.choices[0].message
                    ? response.choices[0].message.content
                    : '';


            if (!raw) {

                throw new Error(
                    'The model returned an empty response.'
                );

            }


            const jsonText =
                cleanJSON(raw);


            let result;

            try {

                result =
                    JSON.parse(jsonText);

            } catch (jsonError) {

                console.error(
                    'Invalid JSON:',
                    raw
                );

                throw new Error(
                    'The local model returned an invalid format. Try generating again.'
                );

            }


            $('spcs-hook').textContent =
                result.hook || '';

            $('spcs-caption').textContent =
                result.caption || '';

            $('spcs-cta').textContent =
                result.cta || '';

            $('spcs-hashtags').textContent =
                result.hashtags || '';


        } catch (error) {

            console.error(
                'Creator Studio generation error:',
                error
            );

            showError(
                error.message ||
                'Generation failed. Please try again.'
            );

        } finally {

            button.disabled = false;

            button.textContent =
                '✨ Generate Content';

        }

    }


    function copyText(text) {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            return navigator.clipboard.writeText(text);

        }


        const textarea =
            document.createElement('textarea');

        textarea.value = text;

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            'copy'
        );

        textarea.remove();

        return Promise.resolve();

    }


    function copyElement(id, button) {

        const element =
            $(id);

        if (!element) return;

        const text =
            element.textContent.trim();

        if (!text) return;

        copyText(text).then(function () {

            const old =
                button.textContent;

            button.textContent =
                '✓ Copied';

            setTimeout(function () {

                button.textContent =
                    old;

            }, 1500);

        });

    }


    function copyAll() {

        const hook =
            $('spcs-hook').textContent.trim();

        const caption =
            $('spcs-caption').textContent.trim();

        const cta =
            $('spcs-cta').textContent.trim();

        const hashtags =
            $('spcs-hashtags').textContent.trim();


        const output =
`HOOK

${hook}

CAPTION

${caption}

CTA

${cta}

HASHTAGS

${hashtags}`;


        copyText(output);

    }


    function init() {

        if (!$('sp-creator-studio')) {
            return;
        }


        $('spcs-load-model')
            .addEventListener(
                'click',
                loadWebLLM
            );


        $('spcs-generate')
            .addEventListener(
                'click',
                generateContent
            );


        $('spcs-copy-all')
            .addEventListener(
                'click',
                copyAll
            );


        document
            .querySelectorAll(
                '#sp-creator-studio .spcs-copy'
            )
            .forEach(function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        copyElement(
                            button.dataset.target,
                            button
                        );

                    }
                );

            });

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();

    }

})();
