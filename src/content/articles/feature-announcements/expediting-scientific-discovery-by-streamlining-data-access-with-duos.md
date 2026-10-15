Currently, the amount of available genomic data and the number of skilled researchers with the right tools to analyze it has significantly increased, leading requests for this data to increase exponentially. However, the world is losing out on valuable opportunities to transform this data into scientific insights that improve human health due to unnecessarily cumbersome data access processes.

### A major bottleneck to scientific impact

Genomic data for human participants is highly identifiable and therefore often categorized as controlled-access data by virtue of the data sharing language in its consent forms. This means access to the data must be regulated by a data access committee (DAC) who assures the data will be shared and used in accordance with the data use terms in the consent forms.

Therefore, researchers must apply for access to such datasets through their designated DAC. In turn, the DAC must review the application to ensure that the researcher’s intended use of the data aligns with the permitted uses of the data, per the participants’ consent. Unfortunately, since the DACs receive language describing permitted data use and intended use from different parties (IRBs/participants vs. researchers) who use unique and sometimes ambiguous language, they are left with an apples:oranges comparison, which is difficult for them to decipher.

![](/article-images/expediting-scientific-discovery-by-streamlining-data-access-with-duos-1.png)

_Current data access processes rely on unique, custom narrative text to describe data uses in consent forms and the datasets they represent, as well as in data access requests for those datasets. This makes adjudicating requests difficult if not impossible for DACs in certain cases._

The added weight of the liability involved in granting someone access to data under uncertain terms often leads DACs to undershare rather than overshare, meaning data is unnecessarily locked down, delaying or blocking significant scientific impact entirely. 

### Facilitating data access for researchers, by enhancing DAC workflows

To address this issue and others like it, the Broad Institute developed [DUOS](https://duos.broadinstitute.org/home) (Data Use Oversight System), a suite of software services and policies for managing data access and sharing ([more detail here](https://terra.bio/ontology-and-automation-a-powerful-duo-for-streamlining-data-access/)). Principally, DUOS aims to consistently and transparently answer the overarching question posed to DACs: “_Does the researcher’s intended use align with the permitted use of the dataset?”_

In fact, DUOS aims to do this in a semi-automated fashion by leveraging the [GA4GH Data Use Ontology (DUO)](https://www.ga4gh.org/news/data-use-ontology-approved-as-a-ga4gh-technical-standard/). The GA4GH DUO provides both human-readable and machine-readable terms and definitions for data use. DUOS utilizes the GA4GH DUO to tag datasets with their permitted use, and data access requests with their intended use in human-readable and machine-readable terms. This standardization allows for DACs and the DUOS matching algorithm to easily determine if a researcher’s intended use aligns with a dataset’s permitted uses in a more apples:apples format, and allows for DUOS to leverage a matching algorithm to suggest a decision to the DAC. The DUOS team is working to further increase the accuracy of the algorithm in making a decision that aligns with that of the DAC. 

![](/article-images/expediting-scientific-discovery-by-streamlining-data-access-with-duos-2.png)

_The GA4GH DUO allows for standardizing data use in consent forms and the datasets they represent, as well as in data access requests for those datasets. With data use language expressed in standardized and machine-readable terms, adjudicating requests is much easier for DACs and even possible to automate algorithmically._

While this automated matching can alleviate a serious bottleneck, other hurdles and data access and sharing remain. We aim to address those concerns in future articles and through our work on DUOS. In the meantime, please visit our website at [www.duos.org](https://duos.broadinstitute.org/) for more information and detailed documentation. Thanks for reading and we hope DUOS serves you well!
