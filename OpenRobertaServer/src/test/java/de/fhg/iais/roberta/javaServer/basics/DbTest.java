package de.fhg.iais.roberta.javaServer.basics;

import java.util.List;

import org.hibernate.Session;
import org.junit.Ignore;

import de.fhg.iais.roberta.persistence.util.SessionFactoryWrapper;
import de.fhg.iais.roberta.util.test.GenericHelperForXmlTest;

public class DbTest {

    @Ignore
    public void test() {
        GenericHelperForXmlTest h = new GenericHelperForXmlTest();
        SessionFactoryWrapper sessionFactoryWrapper =
            new SessionFactoryWrapper(
                "hibernate-cfg.xml",
                "jdbc:hsqldb:file:/home/kcvejoski/dev/OpenRoberta/gitWorkspace/robertalab/OpenRobertaServer/db-old/openroberta-db");
        Session nativeSession = sessionFactoryWrapper.getNativeSession();
        nativeSession.beginTransaction();
        String sqlGetQuery = "select ID, PROGRAM_TEXT from PROGRAM";

        @SuppressWarnings("unchecked")
        List<Object[]> resultSet = nativeSession.createSQLQuery(sqlGetQuery).list();

        int counter = 0;
        for ( Object[] object : resultSet ) {
            try {
                h.assertXMLtransformation((String) object[1]);
            } catch ( Exception e ) {
                println((int) object[0] + ": " + e);
                println((String) object[1]);
            }
            counter++;
        }

        println("" + resultSet.size());
        println("" + counter);
        nativeSession.close();
    }

    private static void println(String msg) {
        System.out.println(msg);
    }
}
