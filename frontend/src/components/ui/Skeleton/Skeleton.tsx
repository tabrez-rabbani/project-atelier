import styles from "./Skeleton.module.css";

const SWATCH_KEYS = [0, 1, 2];
const THUMB_KEYS = [0, 1, 2, 3];
const COLOR_KEYS = [0, 1, 2];
const SIZE_KEYS = [0, 1, 2, 3, 4];
const ACCORDION_KEYS = [0, 1, 2];

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`${styles.bone} ${className}`.trim()} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      <div className={styles.cardSkeleton__image} />
      <div className={styles.cardSkeleton__content}>
        <div className={styles.cardSkeleton__title} />
        <div className={styles.cardSkeleton__priceRow}>
          <div className={styles.cardSkeleton__price} />
          <div className={styles.cardSkeleton__btn} />
        </div>
        <div className={styles.cardSkeleton__swatches}>
          {SWATCH_KEYS.map((i) => (
            <div key={i} className={styles.cardSkeleton__swatch} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewInCardSkeleton() {
  return <div className={styles.newInSkeleton} aria-hidden="true" />;
}

export function CategorySkeleton() {
  return (
    <div className={styles.categorySkeleton} aria-hidden="true">
      <div className={styles.categorySkeleton__circle} />
      <div className={styles.categorySkeleton__name} />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className={styles.detailSkeleton} aria-hidden="true">
      <div className={styles.detailSkeleton__layout}>
        <div className={styles.detailSkeleton__gallery}>
          <div className={styles.detailSkeleton__thumbs}>
            {THUMB_KEYS.map((i) => (
              <div key={i} className={styles.detailSkeleton__thumb} />
            ))}
          </div>
          <div className={styles.detailSkeleton__main} />
        </div>

        <div className={styles.detailSkeleton__info}>
          <div className={styles.detailSkeleton__title} />
          <div className={styles.detailSkeleton__priceRow}>
            <div className={styles.detailSkeleton__price} />
            <div className={styles.detailSkeleton__originalPrice} />
          </div>
          <div className={styles.detailSkeleton__tax} />

          <div className={styles.detailSkeleton__label} />
          <div className={styles.detailSkeleton__colors}>
            {COLOR_KEYS.map((i) => (
              <div key={i} className={styles.detailSkeleton__colorThumb} />
            ))}
          </div>

          <div className={styles.detailSkeleton__sizeLabel} />
          <div className={styles.detailSkeleton__sizes}>
            {SIZE_KEYS.map((i) => (
              <div key={i} className={styles.detailSkeleton__sizeBtn} />
            ))}
          </div>

          <div className={styles.detailSkeleton__actions}>
            <div className={styles.detailSkeleton__addBtn} />
            <div className={styles.detailSkeleton__addBtn} />
            <div className={styles.detailSkeleton__wishBtn} />
          </div>

          <div className={styles.detailSkeleton__accordions}>
            {ACCORDION_KEYS.map((i) => (
              <div key={i} className={styles.detailSkeleton__accordionItem}>
                <div className={styles.detailSkeleton__accordionTitle} />
                <div className={styles.detailSkeleton__accordionIcon} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
