import type { Core } from '@strapi/strapi';

// Creates the starter about page and first post on a fresh database.
// Runs once: a flag in Strapi's store stops it re-seeding after you delete things.

const about = {
  title: 'About',
  body: `I'm Kaustubh, a software engineer based in Dublin.

Most of my work is on the backend. At CueX10 I build retrieval-augmented generation (RAG) systems: ingestion pipelines, search and ranking, and the APIs that sit between a language model and the data it needs to answer well. I like systems that are boring to operate and easy to reason about.

This site is where I write things down, mostly about backend engineering, RAG, and whatever I'm currently trying to understand.

You can find me on [LinkedIn](https://www.linkedin.com/in/kaustubhtrivedi777-software-engineer/) and [GitHub](https://github.com/KaustubhTrivedi).
`,
};

const firstPost = {
  title: 'Retrieval is the hard part of RAG',
  slug: 'retrieval-is-the-hard-part',
  date: '2026-10-26',
  description: 'Notes on why most RAG quality problems are search problems.',
  tags: ['rag', 'backend'],
  body: `When a RAG system gives a bad answer, the first instinct is to blame the model or rewrite the prompt. In my experience the problem is usually upstream: the model never saw the right context.

## The model can only use what you give it

A language model answering over your documents is doing reading comprehension. If the passage that contains the answer isn't in the context window, no amount of prompt engineering will help. So the first question for any bad answer is simple:

> Was the right chunk retrieved?

If the answer is no, you have a search problem, not a generation problem.

## Things that tend to help

- **Chunk on structure, not character counts.** Splitting on headings and paragraphs keeps related sentences together.
- **Use hybrid search.** Keyword search (BM25) catches exact identifiers and names that embeddings blur.
- **Log what you retrieved.** You can't debug retrieval you can't see.

A small example of the last point:

\`\`\`python
def answer(question: str) -> str:
    chunks = retriever.search(question, k=8)
    log.info("retrieved", ids=[c.id for c in chunks], q=question)
    return llm.generate(question, context=chunks)
\`\`\`

None of this is novel. It's plain search engineering, and it's where most of the quality comes from.
`,
};

export async function seed(strapi: Core.Strapi) {
  const flag = { type: 'plugin', name: 'blog', key: 'seeded' };
  if (await strapi.store.get(flag)) return;

  if (!(await strapi.documents('api::about.about').findFirst())) {
    await strapi.documents('api::about.about').create({ data: about });
  }

  if ((await strapi.documents('api::post.post').count({})) === 0) {
    const tagIds: string[] = [];
    for (const name of firstPost.tags) {
      const tag = await strapi.documents('api::tag.tag').create({ data: { name } });
      tagIds.push(tag.documentId);
    }
    await strapi.documents('api::post.post').create({
      data: { ...firstPost, tags: tagIds },
      status: 'published',
    });
  }

  await strapi.store.set({ ...flag, value: true });
  strapi.log.info('Seeded the about page and first post.');
}
