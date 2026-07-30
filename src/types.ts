export interface ContentfulImage {
  fields: {
    file: {
      url: string;
    };
  };
}

export interface Book {
  sys: { id: string };
  fields: {
    title: string;
    author: string;
    slug: string;
    rating?: number;
    genre?: string;
    category?: string;
    coverImage?: ContentfulImage;
    imageUrl?: string;
    summary?: string;
    synopsis?: string;
    reviewText?: any;
    isTopPick?: boolean;
    topPickOrder?: number;
    rank?: number;
    isBottomShelf?: boolean;
    isDiscovery?: boolean;
    firstListedAt?: string;
    previousRank?: number;
    quotes?: string[];
    series?: string;
    bookNumber?: number;
    seriesNumber?: number;
    authorName?: string;
    weeksOnList?: number | string;
    weeks?: number | string;
    chartMovement?: string;
    movement?: string;
  };
}

export interface BlogPost {
  sys: { id: string };
  fields: {
    title: string;
    slug?: string;
    summary?: string;
    excerpt?: string;
    content?: any;
    body?: any;
    category?: string | any;
    categoryTag?: any;
    category_tag?: any;
    categories?: any;
    tags?: any;
    author?: string;
    date?: string;
    readTime?: string;
    imageUrl?: ContentfulImage;
    coverImage?: ContentfulImage;
    is_featured?: boolean;
    isFeatured?: boolean;
    featured?: boolean;
    isTopArticle?: boolean;
    is_top_article?: boolean;
    topArticle?: boolean | any;
    topArticles?: any;
  };
}

export interface RankingList {
  sys: { id: string };
  fields: {
    title?: string;
    name?: string;
    listType: string;
    season?: string;
    timeline?: string;
    itemType?: string;
    isMain?: boolean;
    items?: any[];
    featuredItems?: any[];
  };
}

export interface Author {
  sys: { id: string };
  fields: {
    name: string;
    slug: string;
    image?: ContentfulImage;
    imageUrl?: string;
    bio?: string;
    notableWorks?: any[] | string;
    spotlightQuote?: string;
    isSpotlight?: boolean;
    buyBooksUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    didYouKnow?: string;
    funFacts?: string[];
    websiteUrl?: string;
    socialsUrl?: string;
  };
}

export interface OriginalBook {
  sys: { id: string };
  fields: {
    title: string;
    slug: string;
    synopsis?: string;
    genre?: string;
    coverImage?: ContentfulImage;
    chapters?: any[];
  };
}

export interface Category {
  sys: { id: string };
  fields: {
    title: string;
    slug?: string;
    description?: string;
    books?: any[];
    reference?: any[];
    topPicks?: string;
    discovery?: string;
    bottomShelf?: string;
  };
}

export interface HomepageConfig {
  sys: { id: string };
  fields: {
    curatorName?: string;
    curatorTitle?: string;
    curatorBio?: string;
    heroImage?: ContentfulImage;
    discoveryTitle?: string;
    topPicksTitle?: string;
    bottomShelfTitle?: string;
    blogTitle?: string;
    discoveryDescription?: string;
    topPicksDescription?: string;
    bottomShelfDescription?: string;
    blogDescription?: string;
    reviewsTitle?: string;
    reviewsSubtitle?: string;
    reviewsDescription?: string;
    scriptoriumTitle?: string;
    scriptoriumSubtitle?: string;
    scriptoriumDescription?: string;
    scriptoriumAuthor?: string;
  };
}
