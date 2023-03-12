import { zod as z } from "./deps.ts";
import * as tmpl from "./sql.ts";
import * as safety from "./safety.ts";
import * as l from "./lint.ts";
import * as d from "./domain.ts";
import * as js from "./js.ts";
import * as ns from "./namespace.ts";
import * as i from "./insert.ts";
import * as r from "./record.ts";
import * as cr from "./criteria.ts";
import * as s from "./select.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

export type TableColumnDefn<
  TableName,
  ColumnName,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context> & {
  readonly tableName: TableName;
  readonly columnName: ColumnName;
};

export function isTableColumnDefn<
  TableName,
  ColumnName,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
  args?: { checkTableName: TableName; checkColumnName: ColumnName },
): o is TableColumnDefn<TableName, ColumnName, ColumnTsType, Context> {
  const isTCD = safety.typeGuard<
    TableColumnDefn<TableName, ColumnName, ColumnTsType, Context>
  >("tableName", "columnName");
  if (isTCD(o) && d.isSqlDomain(o)) {
    if (args?.checkTableName && o.tableName != args?.checkTableName) {
      return false;
    }
    if (args?.checkColumnName && o.columnName != args?.checkColumnName) {
      return false;
    }
    return true;
  }
  return false;
}

export type TablePrimaryKeyColumnDefn<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context> & {
  readonly isPrimaryKey: true;
  readonly isAutoIncrement: boolean;
};

export function isTablePrimaryKeyColumnDefn<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TablePrimaryKeyColumnDefn<ColumnTsType, Context> {
  const isTPKCD = safety.typeGuard<
    TablePrimaryKeyColumnDefn<ColumnTsType, Context>
  >("isPrimaryKey", "isAutoIncrement");
  return isTPKCD(o);
}

export type TableColumnInsertDmlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context> & {
  readonly isExcludedFromInsertDML: true;
};

export function isTableColumnInsertDmlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context> {
  const isIDES = safety.typeGuard<
    TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context>
  >("isExcludedFromInsertDML");
  return isIDES(o);
}

export type TableColumnInsertableOptionalSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context> & {
  readonly isOptionalInInsertableRecord: true;
};

export function isTableColumnInsertableOptionalSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnInsertableOptionalSupplier<ColumnTsType, Context> {
  const isIDES = safety.typeGuard<
    TableColumnInsertableOptionalSupplier<ColumnTsType, Context>
  >("isOptionalInInsertableRecord");
  return isIDES(o);
}

export type TableColumnFilterCriteriaDqlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomain<ColumnTsType, Context> & {
  readonly isExcludedFromFilterCriteriaDql: true;
};

export function isTableColumnFilterCriteriaDqlExclusionSupplier<
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnFilterCriteriaDqlExclusionSupplier<ColumnTsType, Context> {
  const isFCDES = safety.typeGuard<
    TableColumnFilterCriteriaDqlExclusionSupplier<ColumnTsType, Context>
  >("isExcludedFromFilterCriteriaDql");
  return isFCDES(o);
}

export function primaryKey<Context extends tmpl.SqlEmitContext>() {
  const zodSchema = z.string();
  const sqlDomain = d.sqlDomain<z.ZodString, Context>(z.string());
  const aipkSD: TablePrimaryKeyColumnDefn<z.ZodString, Context> = {
    ...sqlDomain,
    isPrimaryKey: true,
    isAutoIncrement: false,
    sqlPartial: (dest) => {
      if (dest === "create table, column defn decorators") {
        const ctcdd = sqlDomain?.sqlPartial?.(
          "create table, column defn decorators",
        );
        const decorators: tmpl.SqlTextSupplier<Context> = {
          SQL: () => `PRIMARY KEY`,
        };
        return ctcdd ? [decorators, ...ctcdd] : [decorators];
      }
      return sqlDomain.sqlPartial?.(dest);
    },
  };

  // trick Typescript into thinking the Zod instance is also a SqlDomain
  return d.zodTypeSqlDomain<z.ZodString, typeof aipkSD, Context, string>(
    zodSchema,
    aipkSD,
  );
}

export function autoIncPrimaryKey<Context extends tmpl.SqlEmitContext>() {
  // the zodSchema is optional() because the actual value is computed in the DB
  const zodSchema = z.number().optional();
  const sqlDomain = d.sqlDomain<z.ZodOptional<z.ZodNumber>, Context>(zodSchema);
  const aipkSD:
    & TablePrimaryKeyColumnDefn<z.ZodOptional<z.ZodNumber>, Context>
    & TableColumnInsertDmlExclusionSupplier<
      z.ZodOptional<z.ZodNumber>,
      Context
    > = {
      ...sqlDomain,
      isPrimaryKey: true,
      isExcludedFromInsertDML: true,
      isAutoIncrement: true,
      sqlPartial: (dest) => {
        if (dest === "create table, column defn decorators") {
          const ctcdd = sqlDomain?.sqlPartial?.(
            "create table, column defn decorators",
          );
          const decorators: tmpl.SqlTextSupplier<Context> = {
            SQL: () => `PRIMARY KEY AUTOINCREMENT`,
          };
          return ctcdd ? [decorators, ...ctcdd] : [decorators];
        }
        return sqlDomain.sqlPartial?.(dest);
      },
    };

  // trick Typescript into thinking the Zod instance is also a SqlDomain
  return d.zodTypeSqlDomain<
    z.ZodOptional<z.ZodNumber>,
    typeof aipkSD,
    Context,
    string
  >(
    zodSchema,
    aipkSD,
  );
}

/**
 * Declare a "user agent defaultable" (`uaDefaultable`) primary key domain.
 * uaDefaultable means that the primary key is required on the way into the
 * database but can be defaulted on the user agent ("UA") side. This type of
 * SqlDomain is useful when the primary key is assigned a value from the client
 * app/service before going into the database.
 * @returns
 */
export function uaDefaultableTextPrimaryKey<
  Context extends tmpl.SqlEmitContext,
>(
  zodSchema: z.ZodDefault<z.ZodString>,
) {
  const sqlDomain = d.sqlDomain<z.ZodDefault<z.ZodString>, Context>(zodSchema);
  const uadPK:
    & TablePrimaryKeyColumnDefn<z.ZodDefault<z.ZodString>, Context>
    & TableColumnInsertableOptionalSupplier<
      z.ZodDefault<z.ZodString>,
      Context
    > = {
      ...sqlDomain,
      isPrimaryKey: true,
      isAutoIncrement: false,
      isOptionalInInsertableRecord: true,
      sqlPartial: (dest) => {
        if (dest === "create table, column defn decorators") {
          const ctcdd = sqlDomain?.sqlPartial?.(
            "create table, column defn decorators",
          );
          const decorators: tmpl.SqlTextSupplier<Context> = {
            SQL: () => `PRIMARY KEY`,
          };
          return ctcdd ? [decorators, ...ctcdd] : [decorators];
        }
        return sqlDomain.sqlPartial?.(dest);
      },
    };

  // trick Typescript into thinking the Zod instance is also a SqlDomain
  return d.zodTypeSqlDomain<
    z.ZodDefault<z.ZodString>,
    typeof uadPK,
    Context,
    string
  >(
    zodSchema,
    uadPK,
  );
}

export type ForeignKeyRefPlaceholderLifecycle = "init" | "final";
export type ForeignKeyRefPlaceholder<
  TableName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> = {
  readonly foreignKeyRefPlaceholderLC: ForeignKeyRefPlaceholderLifecycle;
  readonly finalizeForeignKeyRefPlaceholder: (
    foreignKeyRefDest: TableReferenceDest<
      TableName,
      ColumnName,
      ColumnTsType,
      Context
    >,
  ) => void;
};

export function foreignKeyReferenceInit<
  TableName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
>(
  zodSchema: ColumnTsType,
  foreignKeyRefSource: TableReferenceSource<Any, Any, ColumnTsType, Context>,
  finalizeForeignKeyRefPlaceholder?: (
    foreignKeyRefDest: TableReferenceDest<
      TableName,
      ColumnName,
      ColumnTsType,
      Context
    >,
  ) => void,
  foreignKeyRelNature?: TableRefDestRelNature<Context>,
  domainOptions?: Partial<d.SqlDomain<ColumnTsType, Context>>,
) {
  const domain = d.sqlDomain<typeof zodSchema, Context>(zodSchema);
  const result:
    & d.SqlDomain<typeof zodSchema, Context>
    & {
      readonly foreignKeyRefSource: TableReferenceSource<
        Any,
        Any,
        Any,
        Context
      >;
      readonly foreignKeyRefDest: TableReferenceDest<
        TableName,
        ColumnName,
        Any,
        Context
      >;
      readonly foreignKeyRelNature?: TableRefDestRelNature<Context>;
    }
    & ForeignKeyRefPlaceholder<
      TableName,
      ColumnName,
      ColumnTsType,
      Context
    > = {
      foreignKeyRefPlaceholderLC: "init",
      foreignKeyRefSource,
      foreignKeyRefDest: undefined as Any, // this is not set until finalize() is called
      foreignKeyRelNature,
      ...domain,
      ...domainOptions,
      finalizeForeignKeyRefPlaceholder: (foreignKeyRefDest) => {
        finalizeForeignKeyRefPlaceholder?.(foreignKeyRefDest);
        (result.foreignKeyRefDest as Any) = foreignKeyRefDest;
        ((result.foreignKeyRefPlaceholderLC) as "final") = "final";
      },
      sqlPartial: (dest) => {
        if (!(result.foreignKeyRefPlaceholderLC === "final")) {
          throw Error(
            `foreignKeyReferenceInit.sqlPartial called without finalizing the placeholder`,
          );
        }
        if (dest === "create table, after all column definitions") {
          const aacd = domain?.sqlPartial?.(
            "create table, after all column definitions",
          );
          const fkClause: tmpl.SqlTextSupplier<Context> = {
            SQL: ((ctx) => {
              const ns = ctx.sqlNamingStrategy(ctx, {
                quoteIdentifiers: true,
              });
              const tn = ns.tableName;
              const cn = ns.tableColumnName;
              // don't use the foreignTableName passed in because it could be
              // mutated for self-refs in table definition phase
              const ftName = result.foreignKeyRefDest.tableColumnDefn.tableName;
              return `FOREIGN KEY(${
                cn({
                  tableName: "TODO",
                  columnName: result.identity,
                })
              }) REFERENCES ${tn(ftName)}(${
                cn(result.foreignKeyRefSource.tableColumnDefn)
              })`;
            }),
          };
          return aacd ? [...aacd, fkClause] : [fkClause];
        }
        return domain.sqlPartial?.(dest);
      },
    };
  return result;
}

// const selfRefTableNamePlaceholder = "SELFREF_TABLE_NAME_PLACEHOLDER" as const;

// export function selfRefForeignKey<
//   ColumnTsType extends z.ZodTypeAny,
//   Context extends tmpl.SqlEmitContext,
// >(
//   domain: d.SqlDomain<ColumnTsType, Context>,
//   domainOptions?: Partial<d.SqlDomain<ColumnTsType, Context>>,
// ) {
//   return foreignKey(
//     selfRefTableNamePlaceholder,
//     domain,
//     { isSelfRef: true },
//     domainOptions,
//   );
// }

export function typicalTableColumnDefnSQL<
  TableName extends string,
  ColumnName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  isd: d.SqlDomain<Any, Context, ColumnName>,
): tmpl.RenderedSqlText<Context> {
  return (ctx) => {
    const { sqlTextEmitOptions: steOptions } = ctx;
    const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
    const columnName = ns.tableColumnName({
      tableName,
      columnName: isd.identity,
    });
    let sqlDataType = isd.sqlDataType("create table column").SQL(ctx);
    if (sqlDataType) sqlDataType = " " + sqlDataType;
    const decorations = isd.sqlPartial?.(
      "create table, column defn decorators",
    );
    const decoratorsSQL = decorations
      ? ` ${decorations.map((d) => d.SQL(ctx)).join(" ")}`
      : "";
    const notNull = decoratorsSQL.length == 0
      ? isd.isNullable() ? "" : " NOT NULL"
      : "";
    const defaultValue = isd.sqlDefaultValue
      ? ` DEFAULT ${isd.sqlDefaultValue("create table column").SQL(ctx)}`
      : "";
    // deno-fmt-ignore
    return `${steOptions.indentation("define table column")}${columnName}${sqlDataType}${decoratorsSQL}${notNull}${defaultValue}`;
  };
}

export type TableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplier<Context> & {
  readonly tableName: TableName;
};

export function isTableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
  checkName?: TableName,
): o is TableDefinition<TableName, Context> {
  const isTD = safety.typeGuard<
    TableDefinition<TableName, Context>
  >("tableName", "SQL");
  return checkName ? isTD(o) && o.tableName == checkName : isTD(o);
}

export type TableConstraint<Context extends tmpl.SqlEmitContext> =
  tmpl.SqlTextSupplier<Context>;

export type IdentifiableTableConstraint<
  ConstraintIdentity extends string,
  Context extends tmpl.SqlEmitContext,
> = TableConstraint<Context> & {
  readonly constraintIdentity: ConstraintIdentity;
};

export type TableColumnsConstraint<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
> =
  & TableConstraint<Context>
  & {
    readonly constrainedColumnNames: ColumnName[];
  };

export function uniqueContraint<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
>(...constrainedColumnNames: ColumnName[]) {
  const constraint: TableColumnsConstraint<ColumnsShape, Context> = {
    constrainedColumnNames,
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
      const ucQuoted = constrainedColumnNames.map((c) =>
        ns.domainName(String(c))
      );
      return `UNIQUE(${ucQuoted.join(", ")})`;
    },
  };
  return constraint;
}

export function tableConstraints<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof ColumnsShape = keyof ColumnsShape,
>(tableName: TableName, columnsShape: ColumnsShape) {
  let uniqConstrIndex = 0;
  const constraints: (
    & IdentifiableTableConstraint<string, Context>
    & TableColumnsConstraint<ColumnsShape, Context>
  )[] = [];
  const builder = {
    uniqueNamed: (
      constraintIdentity = `unique${uniqConstrIndex}`,
      ...constrainedColumnNames: ColumnName[]
    ) => {
      uniqConstrIndex++;
      const constraint:
        & IdentifiableTableConstraint<string, Context>
        & TableColumnsConstraint<ColumnsShape, Context> = {
          constraintIdentity,
          ...uniqueContraint(...constrainedColumnNames),
        };
      constraints.push(constraint);
      return constraint;
    },
    unique: (...constrainedColumnNames: ColumnName[]) =>
      builder.uniqueNamed(undefined, ...constrainedColumnNames),
  };
  return {
    tableName,
    columnsShape,
    constraints,
    ...builder,
  };
}

export type UniqueTableColumn = { readonly isUnique: boolean };

export const isUniqueTableColumn = safety.typeGuard<UniqueTableColumn>(
  "isUnique",
);

export type TableBelongsToRefDestNature<
  Context extends tmpl.SqlEmitContext,
> = {
  readonly isBelongsToRel: true;
  readonly collectionName?: js.JsTokenSupplier<Context>;
};

export type TableSelfRefDestNature = {
  readonly isSelfRef: true;
};

export type TableRefDestRelNature<Context extends tmpl.SqlEmitContext> =
  | TableBelongsToRefDestNature<Context>
  | TableSelfRefDestNature
  | { readonly isExtendsRel: true }
  | { readonly isInheritsRel: true };

export function belongsToRelation<
  Context extends tmpl.SqlEmitContext,
>(
  singularSnakeCaseCollName?: string,
  pluralSnakeCaseCollName = singularSnakeCaseCollName
    ? `${singularSnakeCaseCollName}s`
    : undefined,
): TableBelongsToRefDestNature<Context> {
  return {
    isBelongsToRel: true,
    collectionName: singularSnakeCaseCollName
      ? js.jsSnakeCaseToken(
        singularSnakeCaseCollName,
        pluralSnakeCaseCollName,
      )
      : undefined,
  };
}

export function isTableBelongsToRefDestNature<
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is TableBelongsToRefDestNature<Context> {
  const isTBFKRN = safety.typeGuard<TableBelongsToRefDestNature<Context>>(
    "isBelongsToRel",
    "collectionName",
  );
  return isTBFKRN(o);
}

export const isTableSelfRefDestNature = safety.typeGuard<
  TableSelfRefDestNature
>("isSelfRef");

export const TableRefSourceType = "foreignKeySource" as const;
export const TableRefDestType = "foreignKeyDest" as const;

export type TableReferenceDest<
  TableName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> =
  & d.ReferenceDestination<typeof TableRefDestType, Context>
  & {
    readonly tableColumnDefn: TableColumnDefn<
      TableName,
      ColumnName,
      ColumnTsType,
      Context
    >;
  }
  // TODO: make this required once we figure out how to specify it
  & { readonly tableRefRelNature?: TableRefDestRelNature<Context> };

export type TableReferenceSource<
  TableName extends string,
  ColumnName extends string,
  ColumnTsType extends z.ZodTypeAny,
  Context extends tmpl.SqlEmitContext,
> =
  & d.ReferenceSource<
    typeof TableRefSourceType,
    TableReferenceDest<TableName, Any, Any, Context>,
    TableName,
    TableDefinition<TableName, Context> & d.SqlDomains<Any, Context>,
    Context
  >
  & {
    readonly tableColumnDefn: TableColumnDefn<
      TableName,
      ColumnName,
      ColumnTsType,
      Context
    >;
  };

export type TableReferencesFactory<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomainReferencesFactory<
  TableReferenceSource<TableName, Any, Any, Context>,
  TableReferenceDest<TableName, Any, Any, Context>,
  TableColumnDefn<TableName, Any, Any, Context>,
  Context
>;

export function tableReferencesFactory<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(_tableName: TableName) {
  const result: TableReferencesFactory<TableName, Context> = {
    prepareSource: (o) =>
      d.asReferenceSource<
        typeof TableRefSourceType,
        TableReferenceDest<TableName, Any, Any, Context>,
        TableReferenceSource<TableName, Any, Any, Context>,
        TableName,
        TableDefinition<TableName, Context> & d.SqlDomains<Any, Context>,
        Context
      >(o, TableRefSourceType, (enhanced) => {
        // o is usually the ZodType._def
        if (isTableColumnDefn(o)) {
          ((enhanced.tableColumnDefn) as Any) = o;
          return enhanced;
        }
        console.dir(o);
        throw Error(
          `tableReferencesFactory.prepareSource.enhance requires a TableColumnDefn`,
        );
      }),
    prepareDest: (o, tableColumnDefn) =>
      d.asReferenceDestination<
        TableReferenceDest<TableName, Any, Any, Context>,
        typeof TableRefDestType
      >(
        o,
        TableRefDestType,
        (enhance) => {
          const enhanced = enhance as TableReferenceDest<
            TableName,
            Any,
            Any,
            Context
          >;
          // TODO: ((enhanced.tableRefRelNature) as Any) = tableName;
          ((enhanced.tableColumnDefn) as Any) = tableColumnDefn;
          return enhanced;
        },
      ),
  };
  return result;
}

export interface TableDefnOptions<
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
  readonly isTemp?: boolean;
  readonly sqlPartial?: (
    destination: "after all column definitions",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  readonly sqlNS?: ns.SqlNamespaceSupplier;
  readonly constraints?: <
    TableName extends string,
  >(
    columnsShape: ColumnsShape,
    tableName: TableName,
  ) => TableColumnsConstraint<ColumnsShape, Context>[];
  readonly refGraph?: <TableName extends string>(
    tableName: TableName,
  ) => TableReferencesFactory<TableName, Context>;
}

export type TablesGraph<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
> = d.SqlDomainsGraph<
  TableName,
  TableReferenceSource<TableName, Any, Any, Context>,
  TableReferenceDest<TableName, Any, Any, Context>,
  d.SqlDomainReferencesFactory<
    TableReferenceSource<TableName, Any, Any, Context>,
    TableReferenceDest<TableName, Any, Any, Context>,
    TableColumnDefn<TableName, Any, Any, Context>,
    Context
  >,
  Context
>;

export function tablesGraph<
  Context extends tmpl.SqlEmitContext,
>() {
  let anonymousTableIndex = 0;
  const tablesRefsGraphs = new Map<
    string,
    d.SqlDomainReferencesFactory<Any, Any, Any, Context>
  >();
  const referenced = new Set<TableReferenceSource<Any, Any, Any, Context>>();
  const references = new Set<TableReferenceDest<Any, Any, Any, Context>>();
  const result: TablesGraph<Any, Context> = {
    referenced,
    references,
    anonymousIdentity: (zSchema) => {
      anonymousTableIndex++;
      const { keys: shapeKeys } = zSchema._getCached();
      return `anonymousTable${anonymousTableIndex}://${shapeKeys.join(",")}`;
    },
    domainRefsFactory: (identity) => {
      let drg = tablesRefsGraphs.get(identity);
      if (!drg) {
        drg = tableReferencesFactory<Any, Context>(identity);
        tablesRefsGraphs.set(identity, drg!);
      }
      return drg!;
    },
    prepareRef: (original, destDomain) => {
      const sds = original._def;
      if (isTableColumnDefn(destDomain)) {
        const drefsGraph = result.domainRefsFactory(sds.tableName);
        const cloned = d.clonedZodType(original);
        const refDest = drefsGraph.prepareDest(cloned._def, destDomain);
        const refSrc = drefsGraph.prepareSource(original._def);
        result.register(refDest, refSrc);
        return cloned as Any; // TODO: properly type this for better maintenance
      } else {
        console.dir(original);
        throw Error(
          `tablesGraph.prepareRef ${original} does not have a tableColumnDefn in ZodType._def`,
        );
      }
    },
    register: (rd, rs) => {
      rs.register(rd);
      referenced.add(rs);
      references.add(rd);
    },
  };
  return {
    anonymousTableIndex,
    tablesRefsGraphs,
    ...result,
  };
}

export function tableDefinition<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: ColumnsShape,
  tablesGraph: TablesGraph<TableName, Context>,
  tdOptions?: TableDefnOptions<ColumnsShape, Context>,
) {
  const columnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const constraints: TableColumnsConstraint<ColumnsShape, Context>[] = [];
  const sd = d.sqlDomains<
    typeof props,
    TablesGraph<TableName, Context>,
    Context,
    TableName
  >(
    props,
    tablesGraph,
  );
  // TODO: handle self-ref foreign keys
  // for (const columnDefn of sd.domains) {
  //   if (
  //     isTableForeignKeyColumnDefn(columnDefn) &&
  //     isTableSelfRefForeignKeyRelNature(columnDefn.foreignRelNature)
  //   ) {
  //     // manually "fix" the table name since self-refs are special
  //     (columnDefn as { foreignTableName: string }).foreignTableName = tableName;
  //   }
  // }

  type ColumnDefns = {
    [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
      z.ZodType<infer T, infer D, infer I> ? TableColumnDefn<
        TableName,
        Extract<Property, string>,
        z.ZodType<T, D, I>,
        Context
      >
      : never;
  };

  const columns: ColumnDefns = {} as Any;
  for (const columnDefn of sd.domains) {
    const typicalSQL = typicalTableColumnDefnSQL(tableName, columnDefn);
    if (columnDefn.sqlPartial) {
      const acdPartial = columnDefn.sqlPartial(
        "create table, after all column definitions",
      );
      if (acdPartial) afterColumnDefnsSS.push(...acdPartial);

      const ctcPartial = columnDefn.sqlPartial(
        "create table, full column defn",
      );
      if (ctcPartial) {
        columnDefnsSS.push(...ctcPartial);
      } else {
        columnDefnsSS.push({ SQL: typicalSQL });
      }
    } else {
      columnDefnsSS.push({ SQL: typicalSQL });
    }
    // TODO: figure out why "Any" is required
    (columnDefn as unknown as { tableName: TableName }).tableName = tableName;
    (columnDefn as unknown as { columnName: string }).columnName =
      columnDefn.identity;
    (columns[columnDefn.identity] as Any) = columnDefn;
  }

  type PrimaryKeys = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isPrimaryKey: true } ? Property
          : never
      >
    ]: ColumnsShape[Property] extends z.ZodType<infer T, infer D, infer I> ? 
        & d.SqlDomain<z.ZodType<T, D, I>, Context>
        & TablePrimaryKeyColumnDefn<z.ZodType<T, D, I>, Context>
      : never;
  };

  type UniqueColumnDefns = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isUnique: true } ? Property
          : never
      >
    ]: ColumnsShape[Property] extends z.ZodType<infer T, infer D, infer I>
      ? d.SqlDomain<z.ZodType<T, D, I>, Context> & UniqueTableColumn
      : never;
  };

  const primaryKey: PrimaryKeys = {} as Any;
  const unique: UniqueColumnDefns = {} as Any;
  for (const column of sd.domains) {
    if (isTablePrimaryKeyColumnDefn(column)) {
      primaryKey[column.identity as (keyof PrimaryKeys)] = column as Any;
    }
    if (isUniqueTableColumn(column)) {
      unique[column.identity as (keyof UniqueColumnDefns)] = column as Any;
      constraints.push(uniqueContraint(column.identity));
    }
  }

  type ForeignKeyRefs = {
    [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
      z.ZodType<infer T, infer D, infer I>
      ? (nature?: TableRefDestRelNature<Context>) =>
        & d.SqlDomain<z.ZodType<T, D, I>, Context>
        & TableReferenceDest<
          TableName,
          Extract<Property, string>,
          z.ZodType<T, D, I>,
          Context
        >
      : never;
  };

  const drf = tablesGraph.domainRefsFactory(tableName);
  const references: ForeignKeyRefs = {} as Any;
  for (const column of sd.domains) {
    (references[column.identity] as Any) = (
      foreignRelNature?: TableRefDestRelNature<Context>,
    ) => {
      // TODO: figure out to make it type-safe without 'any'
      return foreignKeyReferenceInit(
        props[column.identity as Any] as Any,
        drf.prepareSource(props[column.identity as Any]._def),
        undefined,
        foreignRelNature,
      ) as Any;
    };
  }

  afterColumnDefnsSS.push(...constraints);
  if (tdOptions?.constraints) {
    const custom = tdOptions?.constraints(props, tableName);
    afterColumnDefnsSS.push(...custom);
  }

  const tableDefnResult:
    & TableDefinition<TableName, Context>
    & {
      readonly columns: ColumnDefns;
      readonly primaryKey: PrimaryKeys;
      readonly unique: UniqueColumnDefns;
      readonly references: ForeignKeyRefs;
      readonly sqlNS?: ns.SqlNamespaceSupplier;
    }
    & tmpl.SqlSymbolSupplier<Context>
    & l.SqlLintIssuesSupplier
    & tmpl.SqlTextLintIssuesPopulator<Context> = {
      tableName,
      sqlSymbol: (ctx) =>
        ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: tdOptions?.sqlNS,
        }).tableName(tableName),
      populateSqlTextLintIssues: (lis) => {
        for (const sdd of sd.domains) {
          if (l.isSqlLintIssuesSupplier(sdd)) {
            lis.registerLintIssue(...sdd.lintIssues);
          }
        }
        lis.registerLintIssue(...tableDefnResult.lintIssues);
      },
      lintIssues: [],
      registerLintIssue: (...li) => {
        tableDefnResult.lintIssues.push(...li);
      },
      SQL: (ctx) => {
        const { sqlTextEmitOptions: steOptions } = ctx;
        const ns = ctx.sqlNamingStrategy(ctx, {
          quoteIdentifiers: true,
          qnss: tdOptions?.sqlNS,
        });
        const indent = steOptions.indentation("define table column");
        const afterCDs =
          tdOptions?.sqlPartial?.("after all column definitions") ?? [];
        const decoratorsSQL = [...afterColumnDefnsSS, ...afterCDs].map((sts) =>
          sts.SQL(ctx)
        ).join(`,\n${indent}`);

        const { isTemp, isIdempotent } = tdOptions ?? {};
        // deno-fmt-ignore
        const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n)";
        return result;
      },
      columns,
      primaryKey,
      unique,
      references,
      sqlNS: tdOptions?.sqlNS,
    };

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    ...sd,
    ...tableDefnResult,
  };
}

export function tableColumnsRowFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: ColumnsShape,
  tablesGraph: TablesGraph<TableName, Context>,
  tdrfOptions?: TableDefnOptions<ColumnsShape, Context> & {
    defaultIspOptions?: i.InsertStmtPreparerOptions<
      TableName,
      Any,
      Any,
      Context
    >;
  },
) {
  // we compute the tableDefn here instead of having it passed in because
  // Typescript cannot carry all the proper types if we don't generate it here
  const td = tableDefinition(tableName, props, tablesGraph, tdrfOptions);

  // deno-lint-ignore ban-types
  type requiredKeys<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? never : k;
  }[keyof T];

  type addQuestionMarks<
    // deno-lint-ignore ban-types
    T extends object,
    R extends keyof T = requiredKeys<T>,
  > // O extends keyof T = optionalKeys<T>
   = Pick<Required<T>, R> & Partial<T>;

  type EntireRecord = addQuestionMarks<
    {
      [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
        z.ZodType<infer T, infer D, infer I>
        ? z.infer<z.ZodType<T, D, I>> | tmpl.SqlTextSupplier<Context>
        : never;
    }
  >;
  type ExcludeFromInsertDML = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isExcludedFromInsertDML: true }
          ? Property
          : never
      >
    ]: true;
  };
  type ExcludeKeysFromFromInsertDML = Extract<
    keyof EntireRecord,
    keyof ExcludeFromInsertDML
  >;

  type OptionalInInsertableRecord = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isOptionalInInsertableRecord: true }
          ? Property
          : never
      >
    ]: true;
  };
  type OptionalKeysInInsertableRecord = Extract<
    keyof EntireRecord,
    keyof OptionalInInsertableRecord
  >;

  type AllButExcludedAndOptional = Omit<
    Omit<EntireRecord, ExcludeKeysFromFromInsertDML>,
    OptionalKeysInInsertableRecord
  >;
  type InsertableRecord =
    & AllButExcludedAndOptional
    & Partial<Pick<EntireRecord, OptionalKeysInInsertableRecord>>;
  type InsertableObject = r.TabularRecordToObject<InsertableRecord>;

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  const result = {
    prepareInsertable: (
      o: InsertableObject,
      rowState?: r.TransformTabularRecordsRowState<InsertableRecord>,
      options?: r.TransformTabularRecordOptions<InsertableRecord>,
    ) => r.transformTabularRecord(o, rowState, options),
    insertRawDML: i.typicalInsertStmtPreparerSync<
      TableName,
      InsertableRecord,
      EntireRecord,
      Context
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            isTablePrimaryKeyColumnDefn(d) ? true : false
          );
        }
        return td.domains.filter((d) =>
          isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        );
      },
      undefined,
      tdrfOptions?.defaultIspOptions,
    ),
    insertDML: i.typicalInsertStmtPreparerSync<
      TableName,
      InsertableRecord,
      EntireRecord,
      Context
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            isTablePrimaryKeyColumnDefn(d) ? true : false
          );
        }
        return td.domains.filter((d) =>
          isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        );
      },
      (ir) => td.zSchema.parse(ir) as InsertableRecord,
      tdrfOptions?.defaultIspOptions,
    ),
  };
  return result;
}

export function tableSelectFactory<
  TableName extends string,
  ColumnsShape extends z.ZodRawShape,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: ColumnsShape,
  tablesGraph: TablesGraph<TableName, Context>,
  tdrfOptions?: TableDefnOptions<ColumnsShape, Context> & {
    defaultFcpOptions?: cr.FilterCriteriaPreparerOptions<Any, Context>;
    defaultSspOptions?: s.SelectStmtPreparerOptions<
      TableName,
      Any,
      Any,
      Context
    >;
  },
) {
  const td = tableDefinition(tableName, props, tablesGraph, tdrfOptions);

  type OptionalInInsertableRecord = {
    [
      Property in keyof ColumnsShape as Extract<
        Property,
        ColumnsShape[Property] extends { isOptionalInInsertableRecord: true }
          ? Property
          : never
      >
    ]: true;
  };
  type OptionalKeysInInsertableRecord = Extract<
    keyof EntireRecord,
    keyof OptionalInInsertableRecord
  >;

  // deno-lint-ignore ban-types
  type requiredKeys<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? never : k;
  }[keyof T];

  type addQuestionMarks<
    // deno-lint-ignore ban-types
    T extends object,
    R extends keyof T = requiredKeys<T>,
  > // O extends keyof T = optionalKeys<T>
   = Pick<Required<T>, R> & Partial<T>;

  type EntireRecord = addQuestionMarks<
    {
      [Property in keyof ColumnsShape]: ColumnsShape[Property] extends
        z.ZodType<infer T, infer D, infer I>
        ? z.infer<z.ZodType<T, D, I>> | tmpl.SqlTextSupplier<Context>
        : never;
    }
  >;

  type FilterableRecord =
    & Omit<EntireRecord, OptionalKeysInInsertableRecord>
    & Partial<Pick<EntireRecord, OptionalKeysInInsertableRecord>>;
  type FilterableColumnName = keyof FilterableRecord & string;
  type FilterableObject = r.TabularRecordToObject<FilterableRecord>;

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    prepareFilterable: (
      o: FilterableObject,
      rowState?: r.TransformTabularRecordsRowState<FilterableRecord>,
      options?: r.TransformTabularRecordOptions<FilterableRecord>,
    ) => r.transformTabularRecord(o, rowState, options),
    select: s.entitySelectStmtPreparer<
      TableName,
      FilterableRecord,
      EntireRecord,
      Context
    >(
      tableName,
      cr.filterCriteriaPreparer((group) => {
        if (group === "primary-keys") {
          return td.domains.filter((d) =>
            isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as FilterableColumnName[];
        }
        return td.domains.filter((d) =>
          isTableColumnFilterCriteriaDqlExclusionSupplier(d) &&
            d.isExcludedFromFilterCriteriaDql
            ? false
            : true
        ).map((d) => d.identity) as FilterableColumnName[];
      }, tdrfOptions?.defaultFcpOptions),
      tdrfOptions?.defaultSspOptions,
    ),
  };
}

// export function tableDomainsViewWrapper<
//   ViewName extends string,
//   TableName extends string,
//   TPropAxioms extends d.SqlDomains<Any, Context>,
//   Context extends tmpl.SqlEmitContext,
// >(
//   viewName: ViewName,
//   tableName: TableName,
//   props: TPropAxioms,
//   tdvwOptions?:
//     & vw.ViewDefnOptions<
//       ViewName,
//       keyof TPropAxioms & string,
//       Context
//     >
//     & {
//       readonly onPropertyNotAxiomSqlDomain?: (
//         name: string,
//         axiom: ax.Axiom<Any>,
//         domains: d.IdentifiableSqlDomain<Any, Context>[],
//       ) => void;
//     },
// ) {
//   const sd = d.sqlDomains(props, tdvwOptions);
//   const selectColumnNames = sd.domains.map((d) => d.identity);
//   const select: tmpl.SqlTextSupplier<Context> = {
//     SQL: (ctx) => {
//       const ns = ctx.sqlNamingStrategy(ctx, {
//         quoteIdentifiers: true,
//       });
//       return `SELECT ${
//         selectColumnNames.map((cn) =>
//           ns.tableColumnName({
//             tableName,
//             columnName: cn,
//           })
//         ).join(", ")
//       }\n  FROM ${ns.tableName(tableName)}`;
//     },
//   };
//   const selectStmt: ss.Select<ViewName, Context> = {
//     isValid: true,
//     selectStmt: select,
//     ...select,
//     ...sd,
//   };
//   // views use render/dql/select.ts Select statements and they must
//   // start with the literal word SELECT; TODO: fix this?
//   return vw.safeViewDefinitionCustom(viewName, props, selectStmt, tdvwOptions);
// }

export type TableNamePrimaryKeyLintOptions = {
  readonly ignoreTableLacksPrimaryKey?:
    | boolean
    | ((tableName: string) => boolean);
};

/**
 * Lint rule which checks that a given table name has a primary key
 * @param tableDefn the table definition to check
 * @returns a lint rule which, when executed and is not being ignored, will add
 *          a lintIssue to a given LintIssuesSupplier
 */
export const tableLacksPrimaryKeyLintRule = <
  Context extends tmpl.SqlEmitContext,
>(
  tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
) => {
  const rule: l.SqlLintRule<TableNamePrimaryKeyLintOptions> = {
    lint: (lis, lOptions) => {
      const { ignoreTableLacksPrimaryKey: iptn } = lOptions ?? {};
      const ignoreRule = iptn
        ? (typeof iptn === "boolean" ? iptn : iptn(tableDefn.tableName))
        : false;
      if (!ignoreRule) {
        const pkColumn = tableDefn.domains.find((ap) =>
          isTablePrimaryKeyColumnDefn<Any, Context>(ap)
        ) as unknown as (
          | (
            & d.SqlDomain<z.ZodTypeAny, Context>
            & TablePrimaryKeyColumnDefn<Any, Context>
          )
          | undefined
        );
        if (!pkColumn) {
          lis.registerLintIssue({
            lintIssue:
              `table '${tableDefn.tableName}' has no primary key column(s)`,
            consequence: l.SqlLintIssueConsequence.WARNING_DDL,
          });
        }
      }
    },
  };
  return rule;
};

export type TableNameConsistencyLintOptions = {
  readonly ignorePluralTableName?: boolean | ((tableName: string) => boolean);
};

/**
 * Lint rule which checks that a given table name is not pluralized (does not
 * end with an 's').
 * @param tableName the table name to check
 * @returns a lint rule which, when executed and is not being ignored, will add
 *          a lintIssue to a given LintIssuesSupplier
 */
export const tableNameConsistencyLintRule = (tableName: string) => {
  const rule: l.SqlLintRule<TableNameConsistencyLintOptions> = {
    lint: (lis, lOptions) => {
      const { ignorePluralTableName: iptn } = lOptions ?? {};
      const ignoreRule = iptn
        ? (typeof iptn === "boolean" ? iptn : iptn(tableName))
        : false;
      if (!ignoreRule && tableName.endsWith("s")) {
        lis.registerLintIssue({
          lintIssue:
            `table name '${tableName}' ends with an 's' (should be singular, not plural)`,
          consequence: l.SqlLintIssueConsequence.CONVENTION_DDL,
        });
      }
    },
  };
  return rule;
};

/**
 * A lint rule which looks at each domain (column) and, if it has any lint
 * issues, will add them to the supplied LintIssuesSupplier
 * @param tableDefn the table whose columns (domains) should be checked
 * @returns a lint rule which, when executed and is not being ignored, will
 *          add each column defnintion lintIssue to a given LintIssuesSupplier
 */
export function tableColumnsLintIssuesRule<Context extends tmpl.SqlEmitContext>(
  tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
) {
  const rule: l.SqlLintRule = {
    lint: (lis) => {
      for (const col of tableDefn.domains) {
        if (l.isSqlLintIssuesSupplier(col)) {
          lis.registerLintIssue(
            ...col.lintIssues.map((li) => ({
              ...li,
              location: () => `table ${tableDefn.tableName} definition`,
            })),
          );
        }
      }
    },
  };
  return rule;
}

// export type FKeyColNameConsistencyLintOptions<
//   Context extends tmpl.SqlEmitContext,
// > = {
//   readonly ignoreFKeyColNameMissing_id?:
//     | boolean
//     | ((
//       col: TableForeignKeyColumnDefn<Any, Any, Context>,
//       tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
//     ) => boolean);
//   readonly ignoreColName_idNotFKey?:
//     | boolean
//     | ((
//       col: d.SqlDomain<Any, Context>,
//       tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
//     ) => boolean);
// };

// /**
//  * A lint rule which looks at each domain (column) and, if it has any lint
//  * issues, will add them to the supplied LintIssuesSupplier
//  * @param tableDefn the table whose columns (domains) should be checked
//  * @returns a lint rule which, when executed and is not being ignored, will
//  *          add each column defnintion lintIssue to a given LintIssuesSupplier
//  */
// export function tableFKeyColNameConsistencyLintRule<
//   Context extends tmpl.SqlEmitContext,
// >(
//   tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
// ) {
//   const rule: l.SqlLintRule<FKeyColNameConsistencyLintOptions<Context>> = {
//     lint: (lis, lOptions) => {
//       for (const col of tableDefn.domains) {
//         if (isTableForeignKeyColumnDefn(col)) {
//           const { ignoreFKeyColNameMissing_id: ifkcnm } = lOptions ?? {};
//           const ignoreRule = ifkcnm
//             ? (typeof ifkcnm === "boolean" ? ifkcnm : ifkcnm(col, tableDefn))
//             : false;
//           if (!ignoreRule) {
//             let suggestion = `end with '_id'`;
//             if (d.isSqlDomain(col.foreignDomain)) {
//               // if the foreign key column name is the same as our column we're usually OK
//               if (col.foreignDomain.identity == col.identity) {
//                 continue;
//               }
//               suggestion =
//                 `should be named "${col.foreignDomain.identity}" or end with '_id'`;
//             }
//             if (!col.identity.endsWith("_id")) {
//               lis.registerLintIssue(
//                 d.domainLintIssue(
//                   `Foreign key column "${col.identity}" in "${tableDefn.tableName}" ${suggestion}`,
//                   { consequence: l.SqlLintIssueConsequence.CONVENTION_DDL },
//                 ),
//               );
//             }
//           }
//         } else {
//           const { ignoreColName_idNotFKey: icnnfk } = lOptions ?? {};
//           const ignoreRule = icnnfk
//             ? (typeof icnnfk === "boolean" ? icnnfk : icnnfk(col, tableDefn))
//             : false;
//           if (
//             !ignoreRule && (!isTablePrimaryKeyColumnDefn(col) &&
//               col.identity.endsWith("_id"))
//           ) {
//             lis.registerLintIssue(
//               d.domainLintIssue(
//                 `Column "${col.identity}" in "${tableDefn.tableName}" ends with '_id' but is neither a primary key nor a foreign key.`,
//                 { consequence: l.SqlLintIssueConsequence.CONVENTION_DDL },
//               ),
//             );
//           }
//         }
//       }
//     },
//   };
//   return rule;
// }

export function tableLintRules<Context extends tmpl.SqlEmitContext>() {
  const rules = {
    tableNameConsistency: tableNameConsistencyLintRule,
    columnLintIssues: tableColumnsLintIssuesRule,
    // fKeyColNameConsistency: tableFKeyColNameConsistencyLintRule,
    noPrimaryKeyDefined: tableLacksPrimaryKeyLintRule,
    typical: (
      tableDefn: TableDefinition<Any, Context> & d.SqlDomainsSupplier<Context>,
      ...additionalRules: l.SqlLintRule<Any>[]
    ) => {
      return l.aggregatedSqlLintRules<
        & TableNameConsistencyLintOptions
        // & FKeyColNameConsistencyLintOptions<Context>
        & TableNamePrimaryKeyLintOptions
      >(
        rules.tableNameConsistency(tableDefn.tableName),
        rules.noPrimaryKeyDefined(tableDefn),
        rules.columnLintIssues(tableDefn),
        // rules.fKeyColNameConsistency(tableDefn),
        ...additionalRules,
      );
    },
  };
  return rules;
}
