qcc
===
*Qualitative coding collector: a qualitative data analysis tool*

qcc is a tool that sifts through a list of Google Drive documents (or HTML
files) and compiles a sorted document with all the highlighted text. The
collected paragraphs are sorted based on a 'guide' document that needs to
be provided which contains all the categories you wish to filter on,
highlighted with a certain color.

The purpose of this tool is to aid in the process of coding qualitative
data. When applying open or axial coding as described in the [Grounded
Theory](https://en.wikipedia.org/wiki/Grounded_theory) methodology on
a large set of qualitative data like transcribed interviews, you can
end up with an exuberant amount of categories. This tool can help you keep
track of what quotes belong to what concepts and present them in a sorted
document so you don't have to pore over your source material every time
you ask yourself 'which of my interviewees said something related to this
topic?'

## Install

```
git clone https://github.com/vdloo/qcc.git
cd qcc
npm install
```

Note that this program uses the latest version of jsdom which requires io.js instead of Node.js.

## Examples

Generate out.html by using the provided example guide and transcriptions.
```
$ ./qcc.js -g examples/guide.html -t examples/transcripts/
```

You can also provide files in the form of multiple arguments instead of
a directory.
```
$ ./qcc.js -g examples/guide.html -t examples/transcripts/highlighted_transcript_1.html -t examples/transcripts/highlighted_transcript_2.html

```

Same thing goes for a file containing paths to files.
```
$ ./qcc.js -g examples/guide.html -t examples/listoftranscripts.txt

```

If you provide Google API credentials you can directly provide Drive file ids
instead of exported html documents. Run:

```
$ ./generate-google-auth-url.js -i $GOOGLE_CLIENT_ID -s $GOOGLE_CLIENT_SECRET
```

and save the output in a runcom file. You can also directly put the tokens
in your environment by running:

```
$ `./generate-google-auth-url.js -i $GOOGLE_CLIENT_ID -s $GOOGLE_CLIENT_SECRET --silent`
```

With valid oauth credentials you can use Google Drive file ids. This is
the string in the URL between /document/d/ and /edit.
```
$ ./qcc.js -g 1OVcc__rOqlRCoJuUxYhazf21HsvajeVk5uYZyOazQ-c -t 11Z0ulAl2x0nVv1fYIPZoedSWGxUo9nSgHRw-wNodEkg -t 1T-38buld61SdRvU8bZWd1mysvrhKG-kVRZCrsjv_3gE

```
