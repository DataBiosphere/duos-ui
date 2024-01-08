export const firstNonEmptyPropertyValue = (dataset: any, propertyNames: string[]): string => {
    for (const propertyName of propertyNames) {
        let propertyValue: string[] = [];
        if ('study' in dataset && 'properties' in dataset.study) {
            const property = dataset.study.properties.find((property: any) => property.key === propertyName);
            const value = property?.value;
            if (value !== undefined) {
                const valueAsIterable = typeof value === 'string' ? [value] : value;
                propertyValue.push(...valueAsIterable);
            }
        }
        if ('properties' in dataset && propertyValue.length === 0) {
            const property = dataset.properties.find((property: any) => property.propertyName === propertyName);
            const value = property?.propertyValue;
            if (value !== undefined) {
                const valueAsIterable = typeof value === 'string' ? [value] : value;
                propertyValue.push(...valueAsIterable);
            }
        }
        if (propertyValue.length > 0) {
            return propertyValue.join(', ');
        }
    }
    return '';
}
