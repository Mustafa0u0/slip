import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <p className="text-muted text-xs tracking-[0.14em] uppercase">Slip</p>

      <h1 className="mt-6 max-w-[16ch] text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
        Write an invoice. Send a link.
      </h1>

      <p className="text-muted mt-6 max-w-[52ch] text-lg leading-relaxed">
        No account, no password, no monthly fee for something you do six times a
        month. You get two links — one to send your client, one to keep.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/new" className="btn btn-primary">
          Write an invoice
        </Link>
        <Link href="/example" className="btn btn-quiet">
          See one first
        </Link>
      </div>

      <section className="border-rule mt-20 grid gap-10 border-t pt-12 sm:grid-cols-3">
        <Point title="It prints">
          The page your client opens is the document they file. Ctrl-P gives a
          clean PDF with no buttons in it, because that is what they will do
          with it.
        </Point>
        <Point title="It adds up">
          Money is held in sen, never in floating point, and rounded once. An
          invoice that disagrees with a client&rsquo;s calculator costs a phone
          call.
        </Point>
        <Point title="It says what is owed">
          The amount due is the largest thing on the page, and overdue is
          worked out from the date rather than remembered by a background job
          that might be down.
        </Point>
      </section>

      <footer className="border-rule text-muted mt-20 border-t pt-8 text-sm">
        <p>
          Anyone with the link can read the invoice. That is the trade for
          having no accounts — reasonable for a document you are about to email
          anyway, and written down rather than hidden.
        </p>
      </footer>
    </main>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-medium">{title}</h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
