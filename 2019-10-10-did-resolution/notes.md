# DID Resolution Spec Weekly Meeting

Meeting Page:

https://docs.google.com/document/d/1qYBaXQMUoB86Alquu7WBtWOxsS8SMhp1fioYKEGCabE/

## Agenda Thursday 10 October 2019

 1. Welcome and CCG IPR reminder
 1. Call info and scribe selection
 1. Agenda creation/review/prioritization
 1. Relationship between DID spec (in DID WG) and DID Resolution spec (in CCG)
 1. Discussion about metadata about DID Documents (see w3c/did-spec#65)
 1. Transforming DID Documents during resolution (see #40)
 1. AOB
 1. Next meeting

## Notes:

### Topic #4:

Dmitri: There is overlap between both groups, discussions will happen in both. Proposal can be discussed in CCG calls and then submitted to the WG. They are complementary.

Justin: Should DID Resolution be moved into the DID WG? The DID WG Charter talks about mapping a DID to a DID Document. Maybe the situation is not complementary, but parallel efforts.

Dmitri: Should the DID Resolution work be moved into the DID WG for a cleaner relationship?

Justin: Yes.

Markus: This means that DID Resolution work would only be open to WG members.

Justin: Yes both those same people probably care enough about both to become members.

Victor: Can't afford to join DID WG, so this would exclude JLINC labs.

Markus: The separation was motivated by the VC WG. But for DIDs, the syntax, data model, and resolution are much more closely related.

Dmitri: Let's bring this up with the DID WG chairs.

Justin: Individuals can be invited to WGs as community experts.

Victor: JLINC labs is planning to join as soon as budget allows.

Jonny: I'm in the same boat, with limited budget it's hard to participate.

Markus: Couldn't the WG and CG discuss all DID-related topics?

Jonny: In theory a good idea, but has practical issues related to transparency, patents, etc.

Justin: In IETF this would be done as sub-committees of a working group.

Markus: Let's reach out to WG and CG chairs.

Dmitri: +1

### Topic #5:

https://github.com/w3c/did-spec/issues/65

Markus: Discussion about metadata about DID Document

Dmitri: Does the DID Document have room for metadata about the DID Document, not just about the DID Subject (public keys, services)?

We're not talking about metadata about resolution itself (how long did it take, what server nodes were involved). This does clearly not go into the DID Document.

But there's this area in between about fields that relate to the DID Document but not the subject (e.g. when did the DID Document get created/updated? What about proofs in the DID Document?)

If a DID Document is on a ledger, then the ledger handles signatures/proofs. But not all DID Documents will be stored on ledgers or immutable storage. Some DID methods may use mutable storage (e.g. did:web, did:btcr in some cases).

My personal view on it is that those fields actually belong into the DID Document. The DID Document should be able to stand on its own, have the ability to be integrity protected, etc.

Jonny: Let's consider timestamps. If it can be inferred from the block where it is stored, then there is reliance on that.

Dmitri: Two fundamentally different timestamps: When the DID Document was created vs. when the DID Document was registered on a ledger.

Robert: Is this about enriching a DID Document using a "microledger"?

Dmitri: We're talking about giving DID proof capabilities similar to a ledger.

Victor: You could get two different DID Document from two different sources. Maybe then the metadata becomes important.

Robert: In the case of did:peer, you can only "resolve" the DID on the client side. This is where a microledger is useful.

Dmitri: Yes this is crucial for the did:peer method. What if we offload this topic to each individual DID method spec? Some methods may need this more than others. I think Christopher Allen phrased this as an important topic that should be addressed in the main spec.

Justin: Decide what bit happens in which component. Agreed that this is up to the DID method specs.

Robert: In the main spec, we can say that the implementation of a DID method needs provide a consistent flow of data so you can't override. Whoever resolves it should be able to trace back.

Justin: What you're describing is the generic matrix parameters, e.g. related to versioning.

Dmitri: Will we agree on general mechanisms for updating/rotating DIDs? Will new versions have backlinks? The other thing that was brought up is where should an error happen? Is it the responsibility of a resolver to validate proofs, or is that the responsibility of the client?

Robert: In our project we discussed attacks on resolvers. A resolved can easily return fake DID Documents. How do you make sure that what you resolve is connected to what you already know about the DID? Resolution is a weak part of the architecture.

Dmitri: Tension between two approaches: 1. Your use-case is high-risk enough so you pick a DID method carefully that is known to be secure, and you only use those DID methods/resolvers, or 2. For low-risk use case you can use a Universal Resolver to allow as many DID methods as possible.

Jonny: This reminds me of a situation with Keybase. Someone asked me to send money, someone with a similar name but not the person I thought. Where do you hold your trust? In the underlying protocol, or should the DID Document stand on its own?

Markus: At IIW there were sessions by Sam Smith about "self-certifying identifiers".

Robert: In IPFS (content-based networks), you don't care who is providing this, because you know you can trust the content. It would be great if you could do the same with the DID Document.

Dmitri: We can re-use similar proof mechanisms as in VCs.

Markus: Reminds me of httpRange-14 discussion. If the DID identifies both the DID Subject and DID Document simultaneously, then perhaps it's okay that the DID Document also contains metadata about the DID Subject and DID Document.

Drummond: One idea back then was to use the "bare" DID as identifier for the DID Subject, and that additional syntax (e.g. semicolon) would be used for a DID URL for the DID Document.

Dmitri: To add to that: What you just described is almost exactly the route that WebID took. They have different URLs for the document and the subject.

Drummond: This seems like the reverse, i.e. the "bare" identifier is for the document, and something is added to identify the subject.

Dmitri: Personally I'd prefer to stick with the current slightly fuzzy conflation of the two. Think of Wikipedia entries for celebrities (https://en.wikipedia.org/wiki/Justin_Bieber). This can be considered an identifier for both the person and the wiki page.

Jonny: In HTTP, the identifier is closely linked to a protocol, e.g. adding a slash tells the server exactly how to process it.

Drummond: Tend to agree with Dmitri, by default use the identifier for both. Only in cases where it really matters could we make an explicit distinction.

Markus: Academic correctness vs. practicality.

Drummond: Also in favor of moving DID Resolution work into the WG.

