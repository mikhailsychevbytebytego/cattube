# CatTube

[![Watch the CatTube exercise](https://img.youtube.com/vi/E5Ef_Kne17U/maxresdefault.jpg)](https://www.youtube.com/watch?v=E5Ef_Kne17U)

CatTube is a small, working version of YouTube, built by directing an agent instead of writing the code by hand. The point of the exercise is to get a real site on the internet quickly: a homepage, a watch page, a database, and a catalog of generated cat videos that look good enough to show someone.

You do not need to be a software engineer. If you can use an IDE, a terminal, and follow a prompt, you can rebuild this. The finished code in this repository is the result. The steps below are how it was made, with the prompts cleaned up so you can paste them.

## What you are building

Two pages carry the product.

The **homepage** is the top bar (search and account), the left sidebar, category chips, and a grid of videos. The **watch page** keeps the top bar, hides the sidebar so the player has the room, and adds the player, title, description, comments, and a right rail of related videos.

Everything else is there to make those two pages real:

- Postgres holds the catalog, so the pages are no longer a static mock.
- An admin UI lets you inspect and edit that catalog.
- fal.ai writes the titles, thumbnails, and short videos. Cloudflare serves the images and the video streams, so you do not build a video pipeline.
- CLIP embeddings and pgvector rank related videos and search results by similarity, which is a small stand-in for recommendation and search.
- Better Auth adds sign-in, an admin flag, channel subscriptions, and a subscriptions feed.
- Dark mode is the last bit of polish.
- GitHub and Vercel put it on the public internet.

Uploads, a real recommendation team, and ads are out of scope. The data is mock. The site is not.

## What you need

An agentic editor is enough. This exercise uses [Cursor](https://cursor.com). Codex (or any GPT Image model) is used only to draw the two page mockups. Stay in one chat for the whole build so the agent keeps the context.

Paid:

- Cursor, Codex, or another agent subscription
- [Cloudflare](https://www.cloudflare.com) for Images and Stream
- [fal.ai](https://fal.ai) for text, image, and video generation

Free:

- [Next.js](https://nextjs.org) with TypeScript and React
- [Supabase](https://supabase.com) Postgres, with the pgvector extension
- [Drizzle](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [GitHub](https://github.com)
- [Vercel](https://vercel.com) Hobby

Before the data-generation step, create a Supabase project and a Cloudflare account, and put a fal.ai key aside. Do not commit `.env`. Secrets stay local and get pasted into Vercel at deploy time.

Use plan mode when a task has a lot of moving parts (the database move, and the video pipeline). Use agent mode for the straightforward steps. Approve the commands the agent wants to run.

## 1. Scaffold the app

Open an empty folder in Cursor and send:

```text
Set up a Next.js project using current best practices. Make no mistakes.
```

Wait until the dev server is open in the browser. The page will be the default Next.js starter. That is the foundation.

## 2. Draw the homepage

In Codex, or another GPT Image session, generate the target UI. Models already know what YouTube looks like, so the prompt stays short:

```text
Generate an image of the CatTube homepage. Make it look like YouTube, but every video, channel, and icon is about cats. Include the top bar with search, the left sidebar, category chips, and a grid of videos.
```

GPT Image 2.5 is a good default. Nano Banana and Qwen Image are reasonable alternatives. You can also skip the image and describe the page in text. For a product this well known, that works. For a product the model has never seen, the image is the better brief.

## 3. Implement the homepage

Drag the image into the Cursor chat:

```text
Please implement the CatTube home page based on the provided image.
```

Check the result at desktop width and at a phone width. Test the layout and fix it if needed:

```text
The site does not occupy the full viewport. Please fix it.
```

The agent should build the page structure, make the category chips switch the grid, and cut avatars and thumbnails out of the mockup so the page is not one flat picture.

## 4. Draw and implement the watch page

Continue the same Codex session:

```text
Now generate the CatTube watch page. Keep the top bar, hide the left sidebar so the player has room, and include the player, title, description, comments, and a right rail of related videos.
```

Drag that image into the same Cursor chat:

```text
Now implement and connect the watch page.
```

Click from the homepage into a video and back. The player can be a fake one at this point. The time moving forward is enough. The sidebar should be hidden on the watch page, the way YouTube hides it to give the video the space.

## 5. Connect Postgres

Create a Supabase project. In the dashboard, open **Connect**, choose the ORM option, and choose **Drizzle**. Supabase gives you both a `DATABASE_URL` and a prompt. Paste that prompt into the agent. It will look like this, with your own connection string:

```text
Install Drizzle ORM and Drizzle Kit. Configure them for this Supabase Postgres database, using the transaction-mode pooler connection string:

DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

Use the pooler URL (port 6543), not the direct database host.
```

Put the real URL in `.env` only. Percent-encode reserved characters in the password (`/`, `@`, `#`, `%`, `*`).

## 6. Move the mock catalog into the database

This step is large. Switch to plan mode:

```text
Please convert all mock data on the website into real database objects and add a CRUD admin UI.
```

If the agent asks about authentication, answer:

```text
No authentication yet. We will add it later. Leave the admin UI open for now.
```

Read the plan. It should cover a real schema (videos, channels, comments, categories, and the relations between them), a migration of the static mock data, and an admin UI to list, create, edit, and delete those records. Then tell it to build the plan.

Check three things: the public site still renders, `/admin` shows the same videos and comments, and the Supabase table editor shows those rows.

## 7. Generate the catalog

Cloudflare hosts the images and the streams. fal.ai does the generation. One fal key is enough, because text models are called through fal as well.

The pipeline has three stages:

1. An LLM invents channels, comments, titles, thumbnail prompts, and short video descriptions. Gemini 3.5 Flash.
2. An image model paints the thumbnail from that description. GPT Image 2.5.
3. A video model turns the thumbnail plus the description into a short clip. MiniMax H3 Max Turbo.

Go back to plan mode:

```text
Let's regenerate the data by:
- wiping the existing data first
- using an LLM via fal.ai to generate mock users, channels, and comments (Gemini 3.5 Flash)
- using an LLM to generate video metadata, including the title, a thumbnail prompt, and a short video description
- using GPT Image 2.5 to generate each thumbnail from that description
- using H3 Max Turbo to generate each video from the description and the source thumbnail
- using Cloudflare to host the image on the image CDN and the video on the video CDN
```

When the plan asks how big the first batch should be, and how the image and video models should be used, answer:

```text
Generate 12 videos. The image model creates the thumbnail from the text description only. The video model creates the video from that thumbnail plus the description.
```

Twelve matches the mock grid and keeps the first video bill small. After it finishes, open a video. The thumbnail and the clip should both be generated, and the player should be playing a real stream.

Then:

```text
Make the videos autoplay.
```

## 8. Related videos

Title search is too brittle. "Cat" will miss "tiger". A CLIP embedding turns a thumbnail into a vector, pgvector stores that vector in the same Postgres database, and cosine similarity ranks the other videos. Similar pictures land next to each other, so a superhero cat comes back with other superhero cats.

```text
Let's implement better related videos by calculating a CLIP embedding of each video thumbnail and storing it in the database, then looking up the closest videos while excluding the current one, using cosine similarity. Use pgvector, and backfill the videos we already have.
```

The rail is easier to judge with more variety. Generate a second batch on two axes, subject and visual style:

```text
Let's generate about 20 extra videos, with embeddings. Use a range of visual and topical themes, so some videos are CGI, some are cartoons, some are noir, and so on. Define two axes, theme and style, and add a few random combinations.
```

Open a noir video, a sports video, and a fashion video. The top of the rail should resemble the video you are watching.

## 9. Search

Related videos compare a thumbnail with other thumbnails, and those embeddings can be computed ahead of time. Search compares a typed query with thumbnails, so the query has to be embedded on the request.

```text
Now implement search by creating an embedding of the user's query and using it to fetch the most relevant videos.
```

Try `noir`, `superhero`, and `sports`. Results should follow the pictures, not only the words in the title.

## 10. Accounts, subscriptions, and dark mode

```text
Let's implement simple email and password authentication with Better Auth, an admin flag, and a test account that already has the flag set. Add the ability to subscribe to channels, and a subscriptions feed I can watch.
```

Sign in with the test account the agent creates. In this repository that account is `admin@cattube.test` / `AdminCats123!`. `/admin` should require it. Subscribe on a watch page, then open the subscriptions feed and confirm those channels are there.

If the button does nothing after you move to another video, the action was still bound to the previous one:

```text
Please make the Subscribe button on the watch page functional.
```

Then the polish:

```text
Now implement a dark mode and a toggle for it.
```

Toggle it on the homepage and on the watch page. The choice should stick after a reload.

## 11. Put it on the internet

Create an empty GitHub repository. The folder may never have been initialized against that remote, and that is fine:

```text
Put this project inside https://github.com/<you>/<repo> now.
```

Do not commit `.env`. Connect the GitHub repo in Vercel, choose the Next.js preset, and import the environment variables from your local `.env`.

The first production deploy will fail. CLIP's Node build expects `onnxruntime-node`, and Vercel's serverless bundle does not include it. Copy the error from the Vercel logs:

```text
My Vercel deployment is failing with:

Error: Failed to load external module @huggingface/transformers: Error: Cannot find module 'onnxruntime-node'

Please fix it and create a GitHub pull request.
```

Review the pull request, open the Vercel preview, and merge once the site loads.

If the next deploy says this:

```text
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

you do not need a Pro plan. Hobby allows 12 bundled functions, and Next.js normally packs these pages into a handful of them. The failure comes from copying the native ONNX package into every route, which makes each page too large to share a bundle. Tell the agent that, and keep CLIP out of the Vercel page functions. Related videos still use the embeddings already stored in Postgres. On Vercel, search falls back to matching titles and channel names. Generating embeddings at request time does not fit a short Hobby function anyway.

After that deploy succeeds, the site is a public CatTube: generated videos, search, related videos, accounts, subscriptions, and dark mode.

## Run this repository

If you cloned the finished app instead of rebuilding it:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed-admin
npm run dev
```

Fill in `.env` from `.env.example`. You need `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 characters), and `BETTER_AUTH_URL`. Catalog generation also needs `FAL_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_IMAGES_ACCOUNT_HASH`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run db:migrate` | Apply the Drizzle migrations |
| `npm run db:generate-catalog` | Wipe and regenerate the 12-video catalog |
| `npm run db:generate-extra` | Add the themed extra videos and their embeddings |
| `npm run db:embed-thumbnails` | Backfill CLIP embeddings |
| `npm run db:seed-admin` | Create the admin test account |

Admin sign-in: `admin@cattube.test` / `AdminCats123!`.
